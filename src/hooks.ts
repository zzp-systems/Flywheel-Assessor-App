import { useState, useEffect, useCallback } from 'react';
import { AssessmentData, AssessmentType, ChecklistItem, Status, Tier } from './types';
import { RED_LIGHT_ITEMS, YELLOW_LIGHT_ITEMS, GREEN_LIGHT_ITEMS, SLATE_LIGHT_ITEMS } from './data';

const DB_NAME = 'FlywheelAssessmentDB';
const STORE_NAME = 'assessments';

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Ensure offline_queue store also exists... Wait, they are using the same STORE_NAME for offline_queue?
// The previous code did: tx.objectStore(STORE_NAME).put(data, key);
// Wait! If keyPath is defined, we can't use put(data, key) if data contains the key. But for `offline_queue`, data is an array!
// So previously, `saveToDB('offline_queue', [...])` would put an array into STORE_NAME. If we set keyPath to 'id', we can't put an array or a primitive.
// It's better to omit keyPath, or create a separate STORE_NAME for offline_queue.
// Let's modify DB setup.

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

function initializeItems(type: AssessmentType): Record<string, ChecklistItem> {
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
  addItems(SLATE_LIGHT_ITEMS[type]);

  return items;
}

export function useAssessment() {
  const [data, setData] = useState<AssessmentData>(() => {
    return {
      id: generateId(),
      type: 'Move-In Assessment Report',
      facilityName: '',
      unitNumber: '',
      building: '',
      unitType: 'Climate-Controlled',
      inspectorName: '',
      date: new Date().toISOString().slice(0, 16),
      weather: '',
      items: initializeItems('Move-In Assessment Report'),
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
      console.log('Successfully uploaded assessments:', queue);
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
    loadFromDB('current_assessment').then(saved => {
      if (saved) {
        setData(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveToDB('current_assessment', data);
    }
  }, [data, isLoaded]);

  const updateField = <K extends keyof AssessmentData>(field: K, value: AssessmentData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const changeType = (newType: AssessmentType) => {
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

  const addPhoto = (dataUri: string, linkedItemId?: string, metadata?: { facilityName: string, unitNumber: string, buildingFloor: string, caption?: string }) => {
    setData(prev => ({
      ...prev,
      photos: [...prev.photos, {
        id: generateId(),
        dataUri,
        caption: metadata?.caption || '',
        timestamp: new Date().toISOString(),
        linkedItemId,
        facilityName: metadata?.facilityName,
        unitNumber: metadata?.unitNumber,
        buildingFloor: metadata?.buildingFloor
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

  const [pendingMappings, setPendingMappings] = useState<any>(null);

  const importBaseline = (baselineJson: string) => {
    try {
      const baselineData: AssessmentData = JSON.parse(baselineJson);
      if (baselineData.type !== 'Move-In Assessment Report') {
        alert('Imported JSON is not a Move-In Assessment Report.');
        return;
      }

      setData(prev => {
        const deltaItems: Record<string, any> = {};
        const ambiguous: any[] = [];
        const baselineItemsList = Object.values(baselineData.items);

        Object.values(prev.items).forEach((item: any) => {
          let candidates = baselineItemsList.filter((b: any) => {
            if (item.baselineId && item.baselineId === b.id) return true;
            if (b.id === item.id) return true;
            return false;
          });

          if (candidates.length === 0) {
            // Text matching fallback
            const normText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const itemNorm = normText(item.text.split('—')[0]);
            candidates = baselineItemsList.filter((b: any) => normText(b.text.split('—')[0]) === itemNorm);
          }

          if (candidates.length === 1) {
            const baselineItem: any = candidates[0];
            deltaItems[item.id] = {
              ...item,
              baselineStatus: baselineItem.status,
              isDeteriorated: baselineItem.status === 'Pass' && item.status === 'Fail',
              repairCostEstimate: 0
            };
          } else if (candidates.length > 1) {
            ambiguous.push({ item, candidates });
          }
        });

        if (ambiguous.length > 0) {
          setPendingMappings({
            ambiguous,
            baselineData,
            deltaItems,
            snapshotPrev: prev
          });
          return prev; // Delay update until resolved
        }

        return { ...prev, deltaItems };
      });
    } catch (e) {
      alert('Invalid JSON format.');
    }
  };

  const cancelMapping = () => setPendingMappings(null);

  const confirmMapping = (resolvedMappings: Record<string, string>) => {
    if (!pendingMappings) return;
    setData((prev) => {
      const newDelta = { ...pendingMappings.deltaItems };
      const baselineItems = pendingMappings.baselineData.items;

      pendingMappings.ambiguous.forEach((amb: any) => {
        const resolvedId = resolvedMappings[amb.item.id];
        if (resolvedId && baselineItems[resolvedId]) {
          const baselineItem: any = baselineItems[resolvedId];
          newDelta[amb.item.id] = {
            ...amb.item,
            baselineStatus: baselineItem.status,
            isDeteriorated: baselineItem.status === 'Pass' && amb.item.status === 'Fail',
            repairCostEstimate: 0
          };
        }
      });
      return { ...prev, deltaItems: newDelta };
    });
    setPendingMappings(null);
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

  const addWorkOrder = (item: ChecklistItem) => {
    setData(prev => {
      const workOrders = prev.workOrders || [];
      if (workOrders.some(wo => wo.itemId === item.id)) {
        return prev;
      }
      return {
        ...prev,
        workOrders: [
          ...workOrders,
          {
            workOrderId: generateId(),
            itemId: item.id,
            itemText: item.text,
            tier: item.tier,
            note: item.note,
            facilityName: prev.facilityName,
            unitNumber: prev.unitNumber,
            buildingFloor: prev.building,
            inspectorName: prev.inspectorName,
            dateCreated: new Date().toISOString(),
            priority: item.tier === 'Red' ? 'Critical' : 'Routine',
            status: 'Open'
          }
        ]
      };
    });
  };

  const queueAssessment = async () => {
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
    pendingMappings,
    cancelMapping,
    confirmMapping,
    addWorkOrder,
    queueAssessment
  };
}
