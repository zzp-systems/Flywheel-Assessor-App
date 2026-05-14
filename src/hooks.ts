import { useState, useEffect, useCallback } from 'react';
import { InspectionData, InspectionType, ChecklistItem, Status, Tier } from './types';
import { RED_LIGHT_ITEMS, YELLOW_LIGHT_ITEMS, GREEN_LIGHT_ITEMS } from './data';

const DB_NAME = 'FlywheelInspectionDB';
const STORE_NAME = 'inspections';

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToDB(key: string, data: any) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, key);
  } catch(e) { console.error('IndexedDB save error', e); }
}

async function loadFromDB(key: string) {
  try {
    const db = await openDB();
    return new Promise<any>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
  } catch(e) { console.error('IndexedDB load error', e); return null; }
}

const generateId = () => Math.random().toString(36).substring(2, 9);

function initializeItems(type: InspectionType): Record<string, ChecklistItem> {
  const items: Record<string, ChecklistItem> = {};
  
  const addItems = (defs: Omit<ChecklistItem, 'status' | 'note'>[]) => {
    defs.forEach(def => {
      items[def.id] = {
        ...def,
        status: 'Pending',
        note: ''
      };
    });
  };

  addItems(RED_LIGHT_ITEMS);
  addItems(YELLOW_LIGHT_ITEMS[type]);
  addItems(GREEN_LIGHT_ITEMS[type]);

  return items;
}

export function useInspection() {
  const [data, setData] = useState<InspectionData>(() => {
    return {
      id: generateId(),
      type: 'Move-In Baseline',
      facilityName: '',
      unitNumber: '',
      building: '',
      unitType: 'Climate-Controlled',
      inspectorName: '',
      date: new Date().toISOString().slice(0, 16),
      weather: '',
      items: initializeItems('Move-In Baseline'),
      photos: [],
      runnerNotes: '',
      managerFollowUp: {
        'Contact vendor': false,
        'Schedule maintenance': false,
        'Order part': false,
        'Escalate to Regional Manager': false
      }
    };
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const getPendingSyncs = async () => {
    const queue = await loadFromDB('offline_queue') || [];
    setPendingSyncCount(queue.length);
    return queue;
  };

  const uploadPendingQueue = async () => {
    const queue = await loadFromDB('offline_queue') || [];
    if (queue.length === 0) return;
    
    setIsSyncing(true);
    // Simulate upload delay
    setTimeout(async () => {
      console.log('Successfully uploaded inspections:', queue);
      await saveToDB('offline_queue', []);
      setPendingSyncCount(0);
      setIsSyncing(false);
      // Simulate toast by keeping it green for a moment?
      // For now the App component will handle it if we add a synced toast.
    }, 2000);
  };

  useEffect(() => {
    getPendingSyncs();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      uploadPendingQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadFromDB('current_inspection').then(saved => {
      if (saved) {
        setData(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveToDB('current_inspection', data);
    }
  }, [data, isLoaded]);

  const updateField = <K extends keyof InspectionData>(field: K, value: InspectionData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const changeType = (newType: InspectionType) => {
    // Preserve Red Light items as they are universal, reset others
    setData(prev => {
      const newItems = initializeItems(newType);
      Object.keys(newItems).forEach(id => {
        if (newItems[id].tier === 'Red' && prev.items[id]) {
          newItems[id] = prev.items[id];
        }
      });
      return { ...prev, type: newType, items: newItems, deltaItems: undefined };
    });
  };

  const updateItemStatus = (id: string, status: Status) => {
    setData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: { ...prev.items[id], status }
      }
    }));
  };

  const updateItemNote = (id: string, note: string) => {
    setData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: { ...prev.items[id], note }
      }
    }));
  };

  const addPhoto = (dataUri: string, linkedItemId?: string, metadata?: { facilityName: string, unitNumber: string, buildingFloor: string }) => {
    setData(prev => ({
      ...prev,
      photos: [...prev.photos, {
        id: generateId(),
        dataUri,
        caption: '',
        timestamp: new Date().toISOString(),
        linkedItemId,
        ...metadata
      }]
    }));
  };

  const removePhoto = (id: string) => {
    setData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== id)
    }));
  };

  const toggleFollowUp = (key: string) => {
    setData(prev => ({
      ...prev,
      managerFollowUp: {
        ...prev.managerFollowUp,
        [key]: !prev.managerFollowUp[key]
      }
    }));
  };

  // Delta Report logic
  const importBaseline = (baselineJson: string) => {
    try {
      const baselineData: InspectionData = JSON.parse(baselineJson);
      if (baselineData.type !== 'Move-In Baseline') {
        alert('Imported JSON is not a Move-In Baseline report.');
        return;
      }

      setData(prev => {
        const deltaItems: Record<string, any> = {};
        
        // Only compare items that exist in current Move-Out checklist (but IDs differ between Move-In and Move-Out)
        // Actually, we must compare based on some heuristic or semantic meaning, 
        // OR compare the Red items directly since IDs match.
        // For Yellow/Green, the IDs differ between Move-In and Move-Out checklists.
        // Let's implement a generalized comparison: we map items by their text or just flag the move-out ones.
        // Given the prompt: "compare each item's status between the two reports... flag items changed from Pass to Fail".
        // It's simplest to compare identical IDs (Red) or require users to just view the baseline alongside.
        // Alternatively, since items differ, we can just attach the baseline items to the delta report.
        
        Object.values(prev.items).forEach(item => {
          // Attempt to find semantic match by checking text similarity or just check Red ones
          const baselineItem = Object.values(baselineData.items).find(b => b.text === item.text || b.id === item.id);
          if (baselineItem) {
            deltaItems[item.id] = {
              ...item,
              baselineStatus: baselineItem.status,
              isDeteriorated: baselineItem.status === 'Pass' && item.status === 'Fail',
              repairCostEstimate: 0
            };
          }
        });

        return { ...prev, deltaItems };
      });
    } catch (e) {
      alert('Invalid JSON format.');
    }
  };

  const updateDeltaCost = (id: string, cost: number) => {
    setData(prev => {
      if (!prev.deltaItems) return prev;
      return {
        ...prev,
        deltaItems: {
          ...prev.deltaItems,
          [id]: { ...prev.deltaItems[id], repairCostEstimate: cost }
        }
      };
    });
  };

  const queueInspection = async () => {
    const queue = await loadFromDB('offline_queue') || [];
    queue.push({
      ...data,
      runTimestamp: new Date().toISOString()
    });
    await saveToDB('offline_queue', queue);
    getPendingSyncs();
    
    // Optionally trigger sync immediately if online
    if (navigator.onLine) {
      uploadPendingQueue();
    }
  };

  return {
    data,
    isLoaded,
    isOnline,
    isSyncing,
    pendingSyncCount,
    updateField,
    changeType,
    updateItemStatus,
    updateItemNote,
    addPhoto,
    removePhoto,
    toggleFollowUp,
    importBaseline,
    updateDeltaCost,
    queueInspection
  };
}
