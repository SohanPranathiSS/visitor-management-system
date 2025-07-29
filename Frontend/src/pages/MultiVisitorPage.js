import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/MultiVisitorPage.css';

const MultiVisitorPage = () => {
    // Get the hostName from the navigation state, with a fallback.
    const location = useLocation();
    const { hostName } = location.state || { hostName: 'Host' };

    return (
        <div className="multi-visitor-container">
            <div className="multi-visitor-card">
                <h1 className="multi-visitor-title">Add a Visitor</h1>
                <p className="multi-visitor-subtitle">How would you like to add the visitor's details?</p>
                
                {/* Action buttons to choose the method of adding a visitor */}
                <div className="multi-visitor-actions">
                    {/* Button to navigate to the manual check-in page */}
                    <Link to="/checkin" state={{ hostName }} className="manual-entry-btn">
                        Manually Enter the Data
                    </Link>
                    
                    {/* Button to navigate to a future business card scanning page */}
                    <Link to="/scanCard1" state={{ hostName }} className="scan-card-btn">
                        Scan Business Card
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MultiVisitorPage;
