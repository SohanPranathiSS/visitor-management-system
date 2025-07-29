import React, { useState, useRef, useEffect } from 'react';
import { checkInVisitor, getHosts } from '../utils/apiService';
import '../styles/VisitorCheckInPage.css';
import { useNavigate, useLocation } from 'react-router-dom';

// This is your OCR API for extracting an ID number from a photo, if needed on this page.
const OCR_API_URL = 'http://127.0.0.1:5000/extract-id-number';

const VisitorCheckInPage = () => {
    // --- Get prefillData and hostName from the route's state ---
    const { state } = useLocation();
    const prefillData = state?.prefillData || {};
    const initialHostName = state?.hostName || '';
    
    // --- Initialize form state with pre-filled data, including new optional fields ---
    const [formData, setFormData] = useState({
        name: prefillData.name || '',
        email: prefillData.email || '',
        phone: prefillData.phone || '',
        designation: prefillData.designation || '',
        company: prefillData.company || '',
        companyTel: prefillData.companyTel || '',
        website: prefillData.website || '',
        address: prefillData.address || '',
        hostName: initialHostName,
        reason: '', // Default value for the select dropdown
        itemsCarried: '',
        photo: null,
        idCardPhoto: null,
        idCardNumber: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isIdCardCameraOn, setIsIdCardCameraOn] = useState(false);
    const [hosts, setHosts] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const videoRef = useRef(null);
    const idCardVideoRef = useRef(null);
    const canvasRef = useRef(null);
    const idCardCanvasRef = useRef(null);
    const navigate = useNavigate();

    // Fetch user role and available hosts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const loggedInUser = JSON.parse(localStorage.getItem('user'));
                if (loggedInUser && loggedInUser.role) {
                    setUserRole(loggedInUser.role);
                    
                    // Fetch available hosts for the user's company
                    const hostsData = await getHosts();
                    setHosts(hostsData);
                    
                    // If user is a host and no initial host name is provided, set it to their own name
                    if (loggedInUser.role === 'host' && !initialHostName && hostsData.length > 0) {
                        setFormData(prev => ({ ...prev, hostName: hostsData[0].name }));
                    }
                }
            } catch (err) {
                console.error('Error fetching user data or hosts:', err);
                setError('Failed to load host information.');
            }
        };
        
        fetchUserData();
    }, [initialHostName]);

    // The rest of your functions (extractIdNumber, camera controls, etc.) remain the same.
    const extractIdNumberFromImage = async (imageDataUrl) => {
        if (!imageDataUrl) {
            setError('No ID card photo available to extract.');
            return;
        }
        try {
            const base64 = imageDataUrl.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('file', blob, 'idcard.jpg');

            const response = await fetch(OCR_API_URL, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) throw new Error('OCR API error');
            const data = await response.json();
            let number = '';
            if (data.Aadhar && data.Aadhar.length > 0) number = data.Aadhar[0];
            else if (data.PAN && data.PAN.length > 0) number = data.PAN[0];
            else if (data['General Numbers'] && data['General Numbers'].length > 0) number = data['General Numbers'][0];
            if (number) {
                setFormData(prev => ({ ...prev, idCardNumber: number }));
                setMessage('ID Card Number extracted successfully!');
            } else {
                setError('No valid ID number found in the image.');
            }
        } catch (err) {
            setError('Failed to extract ID number: ' + err.message);
        }
    };

    useEffect(() => {
        if (isCameraOn) {
            startCamera();
        } else if (!isCameraOn && videoRef.current && videoRef.current.srcObject) {
            stopCamera();
        }

        if (isIdCardCameraOn) {
            startIdCardCamera();
        } else if (!isIdCardCameraOn && idCardVideoRef.current && idCardVideoRef.current.srcObject) {
            stopIdCardCamera();
        }
        return () => {
            stopCamera();
            stopIdCardCamera();
        };
    }, [isCameraOn, isIdCardCameraOn]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Failed to access camera for photo: ' + err.message);
            setIsCameraOn(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startIdCardCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (idCardVideoRef.current) {
                idCardVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Failed to access camera for ID card: ' + err.message);
            setIsIdCardCameraOn(false);
        }
    };

    const stopIdCardCamera = () => {
        if (idCardVideoRef.current && idCardVideoRef.current.srcObject) {
            const tracks = idCardVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            idCardVideoRef.current.srcObject = null;
        }
    };

    const handleCapture = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
            setFormData(prev => ({ ...prev, photo: imageDataUrl }));
            stopCamera();
            setIsCameraOn(false);
        }
    };

    const handleIdCardCapture = () => {
        if (idCardCanvasRef.current && idCardVideoRef.current) {
            const context = idCardCanvasRef.current.getContext('2d');
            idCardCanvasRef.current.width = idCardVideoRef.current.videoWidth;
            idCardCanvasRef.current.height = idCardVideoRef.current.videoHeight;
            context.drawImage(idCardVideoRef.current, 0, 0, idCardCanvasRef.current.width, idCardCanvasRef.current.height);
            const imageDataUrl = idCardCanvasRef.current.toDataURL('image/jpeg');
            setFormData(prev => ({ ...prev, idCardPhoto: imageDataUrl }));
            stopIdCardCamera();
            setIsIdCardCameraOn(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files && files[0]) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => ({ ...prev, [name]: reader.result }));
            };
            reader.readAsDataURL(files[0]);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        const { name, email, hostName, reason, idCardNumber } = formData;
        if (!name || !email || !hostName || !reason || !idCardNumber) {
            setError('Please fill in all required fields.');
            return;
        }

        try {
            await checkInVisitor(formData);
            setMessage('Check-in successful!');
            setTimeout(() => {
                // Navigate to the host dashboard or a success page
                navigate('/host');
            }, 2000);
        } catch (error) {
            setError(error.message || 'Check-in failed.');
        }
    };

    return (
        <div className="visitor-checkin-container">
            <div className="visitor-checkin-content">
                <div className="visitor-checkin-header">
                    <h2 className="visitor-checkin-title">Visitor Check-In</h2>
                    <p className="visitor-checkin-subtitle">Please fill in your details for a smooth check-in process</p>
                </div>
                
                <form className="visitor-checkin-form" onSubmit={handleSubmit}>
                    {/* Personal Information Section */}
                    <div className="form-section">
                        <h3 className="section-title">Personal Information</h3>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Full Name <span className="required-indicator">*</span></label>
                                <input name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="form-field">
                                <label>Email <span className="required-indicator">*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-field">
                                <label>Phone Number</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>ID Card Number <span className="required-indicator">*</span></label>
                                <input name="idCardNumber" value={formData.idCardNumber} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="form-section">
                        <h3 className="section-title">Professional Information</h3>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Designation <span className="optional-indicator">(optional)</span></label>
                                <input name="designation" value={formData.designation} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>Company <span className="optional-indicator">(optional)</span></label>
                                <input name="company" value={formData.company} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>Company Tel <span className="optional-indicator">(optional)</span></label>
                                <input name="companyTel" value={formData.companyTel} onChange={handleChange} />
                            </div>
                            <div className="form-field">
                                <label>Website <span className="optional-indicator">(optional)</span></label>
                                <input name="website" value={formData.website} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Address <span className="optional-indicator">(optional)</span></label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
                        </div>
                    </div>

                    {/* Visit Information Section */}
                    <div className="form-section">
                        <h3 className="section-title">Visit Information</h3>
                        <div className="form-grid">
                            <div className="form-field">
                                <label>Host Name <span className="required-indicator">*</span></label>
                                {userRole === 'admin' ? (
                                    <select name="hostName" value={formData.hostName} onChange={handleChange} required>
                                        <option value="" disabled>-- Select a Host --</option>
                                        {hosts.map(host => (
                                            <option key={host.id} value={host.name}>{host.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input name="hostName" value={formData.hostName} readOnly required />
                                )}
                            </div>
                            <div className="form-field">
                                <label>Reason for Visit <span className="required-indicator">*</span></label>
                                <select name="reason" value={formData.reason} onChange={handleChange} required>
                                    <option value="" disabled>-- Select a Reason --</option>
                                    <option value="Interview">Interview</option>
                                    <option value="Client Meeting">Client Meeting</option>
                                    <option value="Vendor/Supplier Visit">Vendor/Supplier Visit</option>
                                    <option value="Business Partnership/Collaboration">Business Partnership/Collaboration</option>
                                    <option value="Training/Workshop">Training/Workshop</option>
                                    <option value="Official Audit/Inspection">Official Audit/Inspection</option>
                                    <option value="Facility Tour/Investor Visit">Facility Tour/Investor Visit</option>
                                    <option value="Technical Service or Maintenance">Technical Service or Maintenance</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-field">
                            <label>Items/Belongings Being Carried</label>
                            <textarea name="itemsCarried" value={formData.itemsCarried} onChange={handleChange} rows="3" />
                        </div>
                    </div>

                    {/* Photo Capture Section */}
                    <div className="form-section">
                        <h3 className="section-title">Photo Documentation</h3>
                        
                        <div className="camera-section">
                            <h4>Visitor Photo</h4>
                            <div className="camera-controls">
                                <button type="button" className="btn-secondary" onClick={() => setIsCameraOn(true)}>
                                    📷 Start Camera
                                </button>
                                <input type="file" name="photo" accept="image/*" onChange={handleChange} />
                            </div>
                            
                            {isCameraOn && (
                                <div className="video-container">
                                    <video ref={videoRef} autoPlay playsInline />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <div className="camera-controls">
                                        <button type="button" className="btn-success" onClick={handleCapture}>
                                            📸 Capture
                                        </button>
                                        <button type="button" className="btn-danger" onClick={() => setIsCameraOn(false)}>
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {formData.photo && (
                                <div className="photo-preview">
                                    <img src={formData.photo} alt="Visitor Preview" />
                                </div>
                            )}
                        </div>

                        <div className="camera-section">
                            <h4>ID Card Photo</h4>
                            <div className="camera-controls">
                                <button type="button" className="btn-secondary" onClick={() => setIsIdCardCameraOn(true)}>
                                    📷 Start ID Camera
                                </button>
                                <input type="file" name="idCardPhoto" accept="image/*" onChange={handleChange} />
                            </div>
                            
                            {isIdCardCameraOn && (
                                <div className="video-container">
                                    <video ref={idCardVideoRef} autoPlay playsInline />
                                    <canvas ref={idCardCanvasRef} style={{ display: 'none' }} />
                                    <div className="camera-controls">
                                        <button type="button" className="btn-success" onClick={handleIdCardCapture}>
                                            📸 Capture ID
                                        </button>
                                        <button type="button" className="btn-danger" onClick={() => setIsIdCardCameraOn(false)}>
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {formData.idCardPhoto && (
                                <div className="photo-preview">
                                    <img src={formData.idCardPhoto} alt="ID Card Preview" />
                                    <div className="camera-controls">
                                        <button type="button" className="btn-secondary" onClick={() => extractIdNumberFromImage(formData.idCardPhoto)}>
                                            🔍 Extract ID Number
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {message && <div className="visitor-checkin-success">{message}</div>}
                    {error && <div className="visitor-checkin-error">{error}</div>}
                    
                    <button type="submit" className="submit-button">
                        ✅ Complete Check-In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VisitorCheckInPage;
