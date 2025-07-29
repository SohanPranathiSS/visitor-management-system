const USERS_KEY = 'vms_users';
const VISITORS_KEY = 'vms_visitors';
const VISITS_KEY = 'vms_visits';

const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getVisitors = () => {
  const visitors = localStorage.getItem(VISITORS_KEY);
  return visitors ? JSON.parse(visitors) : [];
};

const saveVisitors = (visitors) => {
  localStorage.setItem(VISITORS_KEY, JSON.stringify(visitors));
};

const getVisits = () => {
  const visits = localStorage.getItem(VISITS_KEY);
  return visits ? JSON.parse(visits) : [];
};

const saveVisits = (visits) => {
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits));
};

const addUser = (user) => {
  const users = getUsers();
  if (!users.find(u => u.id === user.id || u.email === user.email)) {
    users.push(user);
    saveUsers(users);
  }
};

const addVisitor = (visitor) => {
  const visitors = getVisitors();
  visitors.push(visitor);
  saveVisitors(visitors);
};

const addVisit = (visit) => {
  const visits = getVisits();
  visits.push(visit);
  saveVisits(visits);
};

export {
  getUsers,
  saveUsers,
  addUser,
  getVisitors,
  saveVisitors,
  addVisitor,
  getVisits,
  saveVisits,
  addVisit
};