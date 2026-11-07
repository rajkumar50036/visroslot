const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  "visroslot";

export interface FirestoreFieldObj {
  [key: string]: any;
}

export function cleanFirestoreDoc(d: any): FirestoreFieldObj {
  if (!d) return {};
  const fields = d.fields || {};
  const id = d.name ? d.name.split("/").pop() : "";
  const res: FirestoreFieldObj = { id };
  for (const [k, v] of Object.entries(fields) as [string, any][]) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = v.doubleValue;
    else if (v.timestampValue !== undefined) res[k] = v.timestampValue;
    else if (v.nullValue !== undefined) res[k] = null;
    else if (v.mapValue !== undefined) {
      res[k] = cleanFirestoreDoc({ name: "", fields: v.mapValue.fields || {} });
      delete res[k].id;
    } else if (v.arrayValue !== undefined) {
      const arr = v.arrayValue.values || [];
      res[k] = arr.map((item: any) => {
        if (item.stringValue !== undefined) return item.stringValue;
        if (item.integerValue !== undefined) return parseInt(item.integerValue, 10);
        if (item.doubleValue !== undefined) return item.doubleValue;
        if (item.booleanValue !== undefined) return item.booleanValue;
        return item;
      });
    }
  }
  return res;
}

export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "id") continue;
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === "boolean") {
      fields[k] = { booleanValue: v };
    } else if (typeof v === "number") {
      if (Number.isInteger(v)) {
        fields[k] = { integerValue: v.toString() };
      } else {
        fields[k] = { doubleValue: v };
      }
    } else if (typeof v === "string") {
      fields[k] = { stringValue: v };
    } else if (Array.isArray(v)) {
      fields[k] = {
        arrayValue: {
          values: v.map((item) => {
            if (typeof item === "number") {
              return Number.isInteger(item) ? { integerValue: item.toString() } : { doubleValue: item };
            }
            if (typeof item === "boolean") return { booleanValue: item };
            return { stringValue: String(item) };
          }),
        },
      };
    } else if (typeof v === "object") {
      fields[k] = {
        mapValue: {
          fields: toFirestoreFields(v),
        },
      };
    }
  }
  return fields;
}

/**
 * Fetch all documents in a collection via Firestore REST API (native fetch, edge-ready)
 */
export async function fetchCollectionRest(collectionName: string): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return [];
    const json: any = await res.json();
    const docs = json.documents || [];
    return docs.map((d: any) => cleanFirestoreDoc(d));
  } catch {
    return [];
  }
}

/**
 * Get single document by ID via Firestore REST API
 */
export async function getDocumentRest(collectionName: string, docId: string): Promise<any | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return null;
    const json: any = await res.json();
    return cleanFirestoreDoc(json);
  } catch {
    return null;
  }
}

/**
 * Write or patch a document by ID via Firestore REST API
 */
export async function setDocumentRest(
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<any | null> {
  const fields = toFirestoreFields(data);
  const payload = JSON.stringify({ fields });
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}?key=${API_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return cleanFirestoreDoc(json);
  } catch {
    return null;
  }
}

/**
 * Find business by slug (case-insensitive, handling I vs l font variations)
 */
export async function findBusinessBySlugRest(targetSlug: string): Promise<any | null> {
  const businesses = await fetchCollectionRest("businesses");
  const cleanTarget = targetSlug.toLowerCase().trim();
  
  for (const b of businesses) {
    const s = (b.slug || "").toLowerCase().trim();
    if (
      s === cleanTarget ||
      s === cleanTarget.replace(/l/g, "i") ||
      s === cleanTarget.replace(/i/g, "l")
    ) {
      return b;
    }
  }

  // Check by ID directly
  for (const b of businesses) {
    if (b.id && (b.id === targetSlug || b.id.toLowerCase() === cleanTarget)) {
      return b;
    }
  }

  return null;
}

/**
 * Delete a document by ID via Firestore REST API
 */
export async function deleteDocumentRest(collectionName: string, docId: string): Promise<boolean> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}/${encodeURIComponent(docId)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Universal REST-backed Firestore DB instance.
 * Transparent drop-in fallback for Firebase Admin Firestore on serverless environments!
 */
export function createRestFirestoreDb(): any {
  const dbInstance: any = {
    doc(pathString: string) {
      const parts = pathString.split("/");
      const col = parts[0];
      const docId = parts.slice(1).join("/");
      return dbInstance.collection(col).doc(docId);
    },
    collection(collectionName: string) {
      let filters: Array<{ field: string; op: string; value: any }> = [];
      let limitCount: number | null = null;
      let orderByField: string | null = null;
      let orderDir: "asc" | "desc" = "asc";

      const queryObj: any = {
        where(field: string, op: string, value: any) {
          filters.push({ field, op, value });
          return queryObj;
        },
        limit(n: number) {
          limitCount = n;
          return queryObj;
        },
        orderBy(field: string, dir: "asc" | "desc" = "asc") {
          orderByField = field;
          orderDir = dir;
          return queryObj;
        },
        async get() {
          const allDocs = await fetchCollectionRest(collectionName);
          let filtered = allDocs.filter((doc) => {
            return filters.every(({ field, op, value }) => {
              const docVal = doc[field];
              if (op === "==") return docVal === value;
              if (op === "!=") return docVal !== value;
              if (op === ">") return docVal > value;
              if (op === ">=") return docVal >= value;
              if (op === "<") return docVal < value;
              if (op === "<=") return docVal <= value;
              if (op === "in") return Array.isArray(value) && value.includes(docVal);
              if (op === "array-contains") return Array.isArray(docVal) && docVal.includes(value);
              return true;
            });
          });

          if (orderByField) {
            filtered.sort((a, b) => {
              const va = a[orderByField!] ?? "";
              const vb = b[orderByField!] ?? "";
              return orderDir === "desc"
                ? String(vb).localeCompare(String(va))
                : String(va).localeCompare(String(vb));
            });
          }

          if (limitCount !== null) {
            filtered = filtered.slice(0, limitCount);
          }

          const docs = filtered.map((d) => ({
            id: d.id,
            ref: { id: d.id, path: `${collectionName}/${d.id}` },
            exists: true,
            data: () => ({ ...d }),
          }));

          return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
            forEach: (cb: (doc: any) => void) => docs.forEach(cb),
          };
        },
        doc(docId: string) {
          const docPath = `${collectionName}/${docId}`;
          return {
            id: docId,
            path: docPath,
            collectionName,
            ref: { id: docId, path: docPath },
            async get() {
              const d = await getDocumentRest(collectionName, docId);
              return {
                id: docId,
                path: docPath,
                ref: { id: docId, path: docPath },
                exists: Boolean(d && Object.keys(d).length > 1),
                data: () => d || {},
              };
            },
            async set(data: any, options?: { merge?: boolean }) {
              let payload = data;
              if (options?.merge) {
                const existing = (await getDocumentRest(collectionName, docId)) || {};
                payload = { ...existing, ...data };
              }
              return await setDocumentRest(collectionName, docId, payload);
            },
            async update(data: any) {
              const existing = (await getDocumentRest(collectionName, docId)) || {};
              const payload = { ...existing, ...data };
              return await setDocumentRest(collectionName, docId, payload);
            },
            async delete() {
              return await deleteDocumentRest(collectionName, docId);
            },
          };
        },
        async add(data: any) {
          const newId = `${collectionName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const payload = { ...data, id: newId };
          await setDocumentRest(collectionName, newId, payload);
          return {
            id: newId,
            get: async () => ({
              id: newId,
              exists: true,
              data: () => payload,
            }),
            update: async (upData: any) => {
              return await setDocumentRest(collectionName, newId, { ...payload, ...upData });
            },
          };
        },
      };

      return queryObj;
    },
    batch() {
      const operations: Array<() => Promise<any>> = [];
      const extractTarget = (docRef: any) => {
        const fullPath = docRef.path || docRef.ref?.path || "";
        const parts = fullPath.split("/");
        const col = docRef.collectionName || parts[0];
        const id = docRef.id || parts[1];
        return { col, id };
      };

      return {
        set(docRef: any, data: any, options?: { merge?: boolean }) {
          operations.push(async () => {
            const { col, id } = extractTarget(docRef);
            if (col && id) {
              let payload = data;
              if (options?.merge) {
                const existing = (await getDocumentRest(col, id)) || {};
                payload = { ...existing, ...data };
              }
              await setDocumentRest(col, id, payload);
            }
          });
          return this;
        },
        update(docRef: any, data: any) {
          operations.push(async () => {
            const { col, id } = extractTarget(docRef);
            if (col && id) {
              const existing = (await getDocumentRest(col, id)) || {};
              await setDocumentRest(col, id, { ...existing, ...data });
            }
          });
          return this;
        },
        delete(docRef: any) {
          operations.push(async () => {
            const { col, id } = extractTarget(docRef);
            if (col && id) {
              await deleteDocumentRest(col, id);
            }
          });
          return this;
        },
        async commit() {
          for (const op of operations) {
            await op();
          }
        },
      };
    },
  };

  return dbInstance;
}

export function getStarterServicesForBusiness(businessId: string, businessName: string) {
  return [
    {
      id: `srv-${businessId}-1`,
      name: "Consultation & Initial Session",
      duration: 30,
      price: 499,
      description: `Comprehensive consultation and service planning with ${businessName}.`,
      category: "Consultation",
      is_active: true,
      business_id: businessId,
    },
    {
      id: `srv-${businessId}-2`,
      name: "Standard Full Service",
      duration: 45,
      price: 899,
      description: `Complete standard appointment with dedicated professional specialist.`,
      category: "Standard Care",
      is_active: true,
      business_id: businessId,
    },
    {
      id: `srv-${businessId}-3`,
      name: "Premium Executive Service",
      duration: 60,
      price: 1499,
      description: `VIP premium appointment featuring extended care and luxury amenities.`,
      category: "VIP Service",
      is_active: true,
      business_id: businessId,
    },
  ];
}

