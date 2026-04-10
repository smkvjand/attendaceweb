import firebaseConfig from './firebase-config.js';

// ── Firebase SDK ──────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, collection,
  query, where, getDocs, deleteDoc, serverTimestamp,
  orderBy, updateDoc, arrayUnion, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FB_ON = firebaseConfig.apiKey !== "YOUR_API_KEY";
let app, auth, db;

if (FB_ON) {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
}

// ── State ─────────────────────────────────────────────────────
export const state = {
  user: null,
  profile: null,
  classes: [],
  students: {},
  attState: {},
  sessions: [],
  calY: new Date().getFullYear(),
  calM: new Date().getMonth(),
  selDate: null,
  editSess: null,
};

export const TODAY = new Date().toISOString().slice(0, 10);

// ── Demo Data ─────────────────────────────────────────────────
export const DEMO = {
  classes: [
    { classId:"c1", className:"MAT BCS", subject:"Mathematics", teacherName:"ram", studentCount:99 },
    { classId:"c2", className:"PHY BCS", subject:"Physics",     teacherName:"ram", studentCount:45 },
    { classId:"c3", className:"CS101",   subject:"Intro to CS", teacherName:"ram", studentCount:60 },
  ],
  students: {
    c1: [
      { uid:"s1", name:"Akirala Aashrith",   rollNo:"2025BCS-004", email:"bcs_2025004@iiitm.ac.in" },
      { uid:"s2", name:"Ajinkya Rathod",     rollNo:"2025BCS-002", email:"bcs_2025002@iiitm.ac.in" },
      { uid:"s3", name:"Akarsh Singh",       rollNo:"2025BCS-003", email:"bcs_2025003@iiitm.ac.in" },
      { uid:"s4", name:"Aman Raghuvanshi",   rollNo:"2025BCS-008", email:"bcs_2025008@iiitm.ac.in" },
      { uid:"s5", name:"Anika Kanade",       rollNo:"2025BCS-009", email:"bcs_2025009@iiitm.ac.in" },
    ],
    c2: [
      { uid:"s6", name:"Aksh Bhagat",     rollNo:"2025BCS-005", email:"bcs_2025005@iiitm.ac.in" },
      { uid:"s7", name:"Akshay Naphade",  rollNo:"2025BCS-006", email:"bcs_2025006@iiitm.ac.in" },
    ],
    c3: [
      { uid:"s8", name:"Akshit Katta", rollNo:"2025BCS-007", email:"bcs_2025007@iiitm.ac.in" },
    ],
  },
  history: [
    { sessionId:"sess1", classId:"c1", className:"MAT BCS", subject:"Mathematics",
      date: TODAY, startTime:"09:00", endTime:"10:00",
      records:[
        { studentId:"s1", studentName:"Akirala Aashrith", status:"absent" },
        { studentId:"s2", studentName:"Ajinkya Rathod",   status:"present" },
        { studentId:"s3", studentName:"Akarsh Singh",     status:"present" },
        { studentId:"s4", studentName:"Aman Raghuvanshi", status:"late" },
        { studentId:"s5", studentName:"Anika Kanade",     status:"present" },
      ]},
    { sessionId:"sess2", classId:"c2", className:"PHY BCS", subject:"Physics",
      date: TODAY, startTime:"11:00", endTime:"12:00",
      records:[
        { studentId:"s6", studentName:"Aksh Bhagat",    status:"present" },
        { studentId:"s7", studentName:"Akshay Naphade", status:"absent" },
      ]},
  ],
};

// ── Auth ──────────────────────────────────────────────────────
export async function login(email, password) {
  if (!FB_ON) {
    state.user    = { uid:"demo", email };
    state.profile = { name: email.split("@")[0], role:"teacher" };
    return;
  }
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  state.user    = cred.user;
  state.profile = snap.exists() ? snap.data() : { name: email, role:"teacher" };
}

export async function register(name, email, password, role) {
  if (!FB_ON) {
    state.user    = { uid:"demo", email };
    state.profile = { name, role };
    return;
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const p = { uid:cred.user.uid, name, email, role, createdAt: serverTimestamp() };
  await setDoc(doc(db, "users", cred.user.uid), p);
  state.user = cred.user; state.profile = p;
}

export async function logout() {
  if (FB_ON) await signOut(auth);
  state.user = null; state.profile = null;
}

export async function changePassword(current, newPass) {
  if (!FB_ON) throw new Error("Connect Firebase to change password");
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, current);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPass);
}

export function onAuth(cb) {
  if (!FB_ON) return;
  onAuthStateChanged(auth, async (user) => {
    if (user && !state.user) {
      state.user = user;
      const snap = await getDoc(doc(db, "users", user.uid));
      state.profile = snap.exists() ? snap.data() : { name: user.email, role:"teacher" };
      cb(state.profile);
    }
  });
}

// ── Classes ───────────────────────────────────────────────────
export async function loadClasses() {
  if (!FB_ON) { state.classes = [...DEMO.classes]; return state.classes; }
  const role = state.profile?.role;
  const q = role === "admin"
    ? collection(db, "classes")
    : query(collection(db,"classes"), where("teacherId","==",state.user.uid));
  const snap = await getDocs(q);
  state.classes = snap.docs.map(d => ({ classId:d.id, ...d.data() }));
  return state.classes;
}

export async function addClass(className, subject, room) {
  const nc = {
    className, subject, room,
    teacherId:   state.user?.uid || "demo",
    teacherName: state.profile?.name || "Teacher",
    studentCount: 0,
  };
  if (!FB_ON) { nc.classId = "c" + Date.now(); state.classes.push(nc); return nc; }
  const ref = await addDoc(collection(db,"classes"), { ...nc, createdAt: serverTimestamp() });
  nc.classId = ref.id;
  state.classes.push(nc);
  return nc;
}

export async function deleteClass(classId) {
  if (FB_ON) await deleteDoc(doc(db,"classes",classId));
  state.classes = state.classes.filter(c => c.classId !== classId);
}

// ── Students ──────────────────────────────────────────────────
export async function loadStudents(classId) {
  if (!FB_ON) { state.students[classId] = DEMO.students[classId] || []; return state.students[classId]; }
  const q = query(collection(db,"users"), where("classIds","array-contains",classId));
  const snap = await getDocs(q);
  state.students[classId] = snap.docs.map(d => ({ uid:d.id, ...d.data() }));
  return state.students[classId];
}

// ── Attendance ────────────────────────────────────────────────
export async function submitAttendance(classId, date, statuses) {
  const sessionId = crypto.randomUUID().replace(/-/g,"").slice(0,16);
  const cls = state.classes.find(c => c.classId === classId);
  const records = statuses.map(ss => ({
    studentId:   ss.uid, studentName: ss.name,
    classId, className: cls?.className || "",
    date, status: ss.status,
    sessionId, markedBy: state.user?.uid || "demo",
    timestamp: Date.now(),
  }));

  if (!FB_ON) {
    DEMO.history.unshift({ sessionId, classId, className:cls?.className, subject:cls?.subject, date, startTime:"", endTime:"", records });
    return records;
  }
  const batch = [];
  for (const r of records) {
    const docId = `${r.studentId}_${classId}_${sessionId}`;
    batch.push(setDoc(doc(db,"attendance",docId), { ...r, recordId:docId }));
  }
  await Promise.all(batch);
  await setDoc(doc(db,"sessions",sessionId), {
    sessionId, classId, className:cls?.className, subject:cls?.subject,
    teacherId:state.user?.uid, date, startTime:"", endTime:"",
    createdAt: serverTimestamp(),
  });
  return records;
}

// ── History ───────────────────────────────────────────────────
export async function loadSessionsForDate(date) {
  if (!FB_ON) return DEMO.history.filter(s => s.date === date);
  const uid  = state.user?.uid;
  const role = state.profile?.role;
  const q = role === "admin"
    ? query(collection(db,"sessions"), where("date","==",date))
    : query(collection(db,"sessions"), where("date","==",date), where("teacherId","==",uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ sessionId:d.id, ...d.data() }));
}

export async function loadSessionRecords(sessionId, classId, date) {
  if (!FB_ON) return DEMO.history.find(s => s.sessionId === sessionId)?.records || [];
  const q = query(collection(db,"attendance"), where("sessionId","==",sessionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ recordId:d.id, ...d.data() }));
}

export async function saveSessionEdits(records) {
  if (!FB_ON) return;
  await Promise.all(records.map(r =>
    r.recordId ? setDoc(doc(db,"attendance",r.recordId), r) : Promise.resolve()
  ));
}

// ── Notifications ─────────────────────────────────────────────
export async function loadNotifications() {
  if (!FB_ON) return [];
  const uid = state.user?.uid;
  const [personal, broadcast] = await Promise.all([
    getDocs(query(collection(db,"notifications"), where("targetUserId","==",uid))),
    getDocs(query(collection(db,"notifications"), where("targetUserId","==","broadcast"))),
  ]);
  const list = [
    ...personal.docs.map(d => d.data()),
    ...broadcast.docs.map(d => d.data()),
  ];
  list.sort((a,b) => b.timestamp - a.timestamp);
  return list;
}

export async function sendNotification(title, message, targetId) {
  if (!FB_ON) return;
  const ref = doc(collection(db,"notifications"));
  await setDoc(ref, {
    notificationId: ref.id, title, message,
    targetUserId: targetId || "broadcast",
    type: "announcement",
    timestamp: Date.now(), read: false,
  });
}
