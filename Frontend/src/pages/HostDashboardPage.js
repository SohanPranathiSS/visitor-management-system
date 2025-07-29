import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getVisits, checkOutVisit } from '../utils/apiService';
import '../styles/HostDashboardPage.css';

const HostDashboardPage = () => {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  console.log('Rendering HostDashboardPage');

  useEffect(() => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      if (loggedInUser) {
        setUser(loggedInUser);
        console.log('User loaded:', loggedInUser);
      } else {
        setError('No user is logged in. Please log in again.');
        console.error('No user found in localStorage');
      }
    } catch (e) {
      setError('Could not retrieve user data. Please log in again.');
      console.error('Error parsing user data:', e);
    }
  }, []);

  const fetchHostVisits = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping fetchHostVisits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Fetching visits for hostId:', user.id);
      console.log('Fetching Name of visits for hostId:', user.name);

      const hostVisitsData = await getVisits({ hostId: user.id });
      console.log('Visits fetched:', hostVisitsData);
      setVisits(hostVisitsData);
    } catch (err) {
      setError('Failed to load your visits. Please try refreshing the page.');
      console.error('Fetch visits error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHostVisits();
  }, [fetchHostVisits]);

  const handleCheckOut = async (visitId) => {
    try {
      console.log('Checking out visit:', visitId);
      await checkOutVisit(visitId);
      fetchHostVisits();
    } catch (err) {
      setError(`Failed to check out visitor: ${err.message}`);
      console.error('Checkout error:', err);
    }
  };

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="host-dashboard-bg">
      <nav className="navbar">
        <div className="navbar-logo">Visitor Management</div>
        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/resources">Resources</Link></li>
          <li><Link to="/aboutus">About Us</Link></li>
          <li><Link to="/bookademo">Book a Demo</Link></li>
          <li><Link to="/contactus">Contact Us</Link></li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <div className="host-dashboard-container">
        <div className="host-dashboard-header-modern">
          <div>
            <h2 className="host-dashboard-title">Host Dashboard</h2>
            <p className="host-dashboard-subtitle">
              Welcome, {user ? user.name : 'Host'}
            </p>
          </div>
          <Link to="/multiVisitor" state={{ hostName: user ? user.name : '' }} className="add-visitor-btn">
            + Add Visitor
          </Link>
        </div>
        {error && <p className="host-dashboard-error">{error}</p>}
        {loading ? (
          <p>Loading your visitors...</p>
        ) : (
          <div className="host-dashboard-table-card">
            <table className="host-dashboard-table-modern">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Email</th>
                  <th>Photo</th>
                  <th>ID Card Photo</th>
                  <th>ID Number</th>
                  <th>Reason</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan="9">You have no visitors currently.</td>
                  </tr>
                ) : (
                  visits.map((visit) => (
                    <tr key={visit.id}>
                      <td>{visit.visitorName}</td>
                      <td>{visit.visitorEmail}</td>
                      <td>
                        {visit.visitorPhoto && (
                          <img
                            src={visit.visitorPhoto}
                            alt="Visitor"
                            className="host-dashboard-photo"
                          />
                        )}
                      </td>
                      <td>
                        {visit.idCardPhoto && (
                          <img
                            src={visit.idCardPhoto}
                            alt="ID Card"
                            className="host-dashboard-photo"
                          />
                        )}
                      </td>
                      <td>
                        {visit.idCardNumber ? visit.idCardNumber : 'N/A'}
                      </td>
                      <td>{visit.reason}</td>
                      <td>{new Date(visit.check_in_time).toLocaleString()}</td>
                      <td>
                        {visit.check_out_time
                          ? new Date(visit.check_out_time).toLocaleString()
                          : 'Checked In'}
                      </td>
                      <td>
                        {!visit.check_out_time ? (
                          <button
                            onClick={() => handleCheckOut(visit.id)}
                            className="host-dashboard-checkout-modern"
                          >
                            Check Out
                          </button>
                        ) : (
                          <span className="host-dashboard-checkedout">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboardPage;