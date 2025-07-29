import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, getVisits, createUser } from '../utils/apiService';
import '../styles/AdminDashboardPage.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    hostName: '',
    visitorName: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [userRole, setUserRole] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Get the user role and company info from localStorage when the component mounts
  useEffect(() => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      if (loggedInUser && loggedInUser.role) {
        setUserRole(loggedInUser.role);
        // Store company info if available
        if (loggedInUser.company_name) {
          setCompanyInfo({
            name: loggedInUser.company_name,
            adminName: loggedInUser.name
          });
        }
      } else {
        setError('Could not determine user role. Please log in again.');
      }
    } catch (e) {
      setError('Could not retrieve user data. Please log in again.');
      console.error('Error parsing user data:', e);
    }

    const fetchAllUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        setError('Failed to load users. Please try again later.');
        console.error(err);
      }
    };
    fetchAllUsers();
  }, []);

  const fetchVisits = useCallback(async () => {
    // Don't try to fetch if the role hasn't been determined yet
    if (!userRole) return;

    setLoading(true);
    setError('');
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );
      // Pass the userRole as the first argument to getVisits
      const visitsData = await getVisits(userRole, activeFilters);
      
      // Remove any potential duplicates based on visit ID
      const uniqueVisits = visitsData.filter((visit, index, self) => 
        index === self.findIndex(v => v.id === visit.id)
      );
      
      setVisits(uniqueVisits);
    } catch (err) {
      setError('Failed to load visit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, userRole]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserInputChange = (e) => {
    setNewUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setNewUser({ name: '', email: '', password: '' });
      setError('');
      const usersData = await getUsers();
      setUsers(usersData);
      setActiveSection('users');
    } catch (err) {
      setError(err.message || 'Failed to create user. Please try again.');
      console.error(err);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // The fetchVisits function is already called whenever filters change.
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    // No need to reload, the router will handle the redirect.
  };

  // Chart logic and other component JSX remains the same...
  // Calculate 30-day visitor stats
  const last30DaysVisits = visits.filter(visit => {
    const visitDate = new Date(visit.check_in_time);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return visitDate >= thirtyDaysAgo;
  });

  // Prepare data for 30-day visitor chart
  const getChartData = () => {
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      labels.push(dateString);
      const count = last30DaysVisits.filter(visit => 
        new Date(visit.check_in_time).toISOString().split('T')[0] === dateString
      ).length;
      data.push(count);
    }
    return {
      labels,
      datasets: [
        {
          label: 'Visitors per Day',
          data,
          backgroundColor: '#0984e3',
          borderColor: '#0984e3',
          borderWidth: 1
        }
      ]
    };
  };

  const chartData = getChartData();

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Visitors'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };

  return (
    <div className="admin-dashboard-bg">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><Link to="/contactus">Contact Us</Link></li>
          <li><button onClick={handleLogout} className="login-btn">Logout</button></li>
        </ul>
      </nav>
      <div className="admin-dashboard-wrapper">
        <aside className="admin-sidebar">
          <h3 className="sidebar-title">Admin Panel</h3>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={activeSection === 'dashboard' ? 'active' : ''} 
                onClick={() => setActiveSection('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'users' ? 'active' : ''} 
                onClick={() => setActiveSection('users')}
              >
                Create Users
              </button>
            </li>
            <li>
              <button 
                className={activeSection === 'visitors' ? 'active' : ''} 
                onClick={() => setActiveSection('visitors')}
              >
                Show Visitors
              </button>
            </li>
          </ul>
        </aside>
        <div className="admin-dashboard-container">
          <h2 className="admin-dashboard-title">Admin Dashboard</h2>
          {error && <p className="admin-dashboard-error">{error}</p>}

          {activeSection === 'dashboard' && (
            <section>
              <h3>Dashboard</h3>
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h4>Last 30 Days Visitors</h4>
                  <p>{last30DaysVisits.length}</p>
                </div>
              </div>
              <h4>Visitors Over Last 30 Days</h4>
              <div style={{ maxWidth: '600px', margin: '20px 0' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <h4>Recent Visitors</h4>
              {loading ? <p>Loading visits...</p> : (
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Visitor Name</th>
                      <th>Host Name</th>
                      <th>Check-In Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last30DaysVisits.slice(0, 5).map(visit => (
                      <tr key={visit.id}>
                        <td>{visit.visitorName}</td>
                        <td>{visit.hostName}</td>
                        <td>{new Date(visit.check_in_time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {activeSection === 'users' && (
            <section>
              <h3>Create Users for Your Company</h3>
              {companyInfo && (
                <div className="company-info-card">
                  <h4>Company: {companyInfo.name || 'Loading...'}</h4>
                  <p>Administrator: {companyInfo.adminName || 'Loading...'}</p>
                  <p className="info-text">Users created here will be assigned to your company and can act as hosts for visitor check-ins.</p>
                </div>
              )}
              <p><em>Note: All created users are assigned the 'host' role.</em></p>
              <form className="admin-dashboard-form" onSubmit={handleCreateUser}>
                <label>
                  Full Name:
                  <input 
                    type="text" 
                    name="name" 
                    value={newUser.name} 
                    onChange={handleUserInputChange} 
                    placeholder="Enter full name (e.g., John Doe)"
                    required 
                  />
                </label>
                <label>
                  Email:
                  <input 
                    type="email" 
                    name="email" 
                    value={newUser.email} 
                    onChange={handleUserInputChange} 
                    placeholder="Enter email address"
                    required 
                  />
                </label>
                <label>
                  Password:
                  <input 
                    type="password" 
                    name="password" 
                    value={newUser.password} 
                    onChange={handleUserInputChange} 
                    placeholder="Enter password (min 8 characters)"
                    required 
                  />
                </label>
                <button type="submit">Create Host</button>
              </form>
              <h3>Company Users</h3>
              {loading ? <p>Loading users...</p> : (
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="4">No users found in your company.</td></tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>{user.company_name || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {activeSection === 'visitors' && (
            <section className="admin-dashboard-section">
              <h3>Company Visitor Logs</h3>
              {companyInfo && (
                <div className="company-info-card">
                  <h4>Viewing visitors for: {companyInfo.name || 'Loading...'}</h4>
                  <p className="info-text">This shows visitors who checked in with hosts from your company and any parent company relationships.</p>
                </div>
              )}
              <form className="admin-dashboard-filter-form" onSubmit={handleFilterSubmit}>
                <label>
                  Start Date:
                  <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </label>
                <label>
                  End Date:
                  <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </label>
                <label>
                  Host Name:
                  <input name="hostName" value={filters.hostName} onChange={handleFilterChange} placeholder="Filter by host name" />
                </label>
                <label>
                  Visitor Name:
                  <input name="visitorName" value={filters.visitorName} onChange={handleFilterChange} placeholder="Filter by visitor name" />
                </label>
                <button type="submit">Filter</button>
              </form>
              {loading ? <p>Loading visits...</p> : (
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Visitor Name</th>
                      <th>Visitor Email</th>
                      <th>Visitor Company</th>
                      <th>Photo</th>
                      <th>Host Name</th>
                      <th>Host Company</th>
                      <th>Reason</th>
                      <th>Check-In Time</th>
                      <th>Check-Out Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.length === 0 ? (
                      <tr><td colSpan="9">No visits found for your company with the selected filters.</td></tr>
                    ) : (
                      visits.map(visit => (
                        <tr key={visit.id}>
                          <td>{visit.visitorName}</td>
                          <td>{visit.visitorEmail}</td>
                          <td>{visit.company || 'N/A'}</td>
                          <td>
                            {visit.visitorPhoto && <img src={visit.visitorPhoto} alt="Visitor" style={{ maxWidth: '80px', borderRadius: '4px' }} />}
                          </td>
                          <td>{visit.hostName}</td>
                          <td>{visit.hostCompany || 'N/A'}</td>
                          <td>{visit.reason}</td>
                          <td>{new Date(visit.check_in_time).toLocaleString()}</td>
                          <td>{visit.check_out_time ? new Date(visit.check_out_time).toLocaleString() : 'Not Checked Out'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
