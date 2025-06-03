import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated, Platform, Button, Modal, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accelerometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { Subscription } from 'rxjs';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import storage from '@react-native-firebase/storage';
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import CustomAlertModal from '../../Components/CustomAlertModal';


// Define the types for our foot images
type FootImage = {
    path: string;
    type: 'left' | 'right' | 'top';
    foot: 'left' | 'right';
};

interface SensorData {
    x: number;
    y: number;
    z: number;
    timestamp: number;
}

// Add type definition for route params
type FootScanScreenParams = {
    customer: {
        id: string;
        // Add other customer properties as needed
    };
    RetailerId: string;
};

const FootScanScreen = () => {
    const [capturedImages, setCapturedImages] = useState<FootImage[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showInitialPopup, setShowInitialPopup] = useState(true);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentFoot, setCurrentFoot] = useState<'left' | 'right'>('left');
    const [currentView, setCurrentView] = useState<'left' | 'right' | 'top'>('left');
    const [isOrientationCorrect, setIsOrientationCorrect] = useState(false);
    const [isDetectingSheet, setIsDetectingSheet] = useState(false);
    const navigation = useNavigation();
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<Camera>(null);

    const route = useRoute();
    const { customer, RetailerId } = route.params as FootScanScreenParams;

    // console.log(customer,RetailerId);


    // volumental webview page
    const [showWebView, setShowWebView] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertModal({
            visible: true,
            title,
            message,
            type,
        });
    };

    const hideAlert = () => {
        setAlertModal(prev => ({ ...prev, visible: false }));
    };

    const handleMessage = async (event: any) => {
        const data = JSON.parse(event.nativeEvent.data);
        console.log('Volumental Event:', data);

        if (data.event === 'OnMeasurement') {
            try {
                // Get access token
                const tokenResponse = await axios.post(
                    'https://login.volumental.com/oauth/token',
                    {
                        grant_type: 'client_credentials',
                        client_id: 'm2IiZHYiVDap31YxnSFbEMoB7MHoCTdW',
                        client_secret: 'ZpoCZLIPFCFOKZh4wJmw6-xddJ1uzwVUoHf5eMjFMEPp5Kvh7G7QgLZEma0DzLiF',
                        audience: 'https://stage-gateway.volumental.com'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                );

                const accessToken = tokenResponse.data.access_token;

                // Fetch scan data using the scan ID
                const scanResponse = await axios.get(
                    `https://widget.volumental.com/api/v1/scans/${data.data.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                );

                const scanData = scanResponse.data;
                const user = getAuth().currentUser;

                if (!user) {
                    throw new Error('User not authenticated');
                }

                // Check if measurements already exist and update instead of creating new
                const measurementsRef = getFirestore()
                    .collection('Retailers')
                    .doc(RetailerId)
                    .collection('measurements')
                    .doc(customer.id);

                await measurementsRef.set({
                    scanId: data.data.id,
                    createdAt: scanData.created_at,
                    measurements: scanData.measurements,
                    meshes: scanData.meshes,
                    scanType: scanData.scan_type,
                    success: scanData.success,
                    storedAt: serverTimestamp(),
                }, { merge: true });


            } catch (error) {
                console.error('Error fetching/storing measurements:', error);
                showAlert('Error', 'Failed to store measurements. Please try again.', 'error');
            }
        }

        if (data.event === 'OnModalClosed') {
            setShowWebView(false); // Close the WebView
            // @ts-ignore - Navigation type issue
            navigation.navigate('InsoleQuestions', {
                customer: customer,
                RetailerId: RetailerId
            });
        }
    };


    const radToDeg = (rad: number) => {
        return rad * (180 / Math.PI);
    };

    const [debugInfo, setDebugInfo] = useState({
        tiltAngle: 0,
        forwardTilt: 0,
        isVertical: false,
        x: 0,
        y: 0,
        z: 0
    });

    // function for a4sheet detection from python server ;

    async function sendImageForDetection(photoUri: string) {
        const formData = new FormData();
        formData.append('image', {
            uri: Platform.OS === 'android' ? 'file://' + photoUri : photoUri,
            type: 'image/jpeg',
            name: 'photo.jpg',
        });

        try {
            const response = await axios.post('https://myfootfirstserver.onrender.com/detect-sheet', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.a4_detected) {
                console.log('A4 Sheet Detected ✅');
                return true;
                // Proceed with saving image
            } else {
                showAlert('No A4 Sheet detected', 'Please retake the picture', 'error');
                return false;
            }
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Something went wrong while detecting', 'error');
        }
    }


    const checkOrientation = useCallback((x: number, y: number, z: number): boolean => {
        // Calculate tilt angle using arctan2
        const tiltAngle = radToDeg(Math.atan2(x, z));
        const forwardTilt = radToDeg(Math.atan2(y, z));

        // Check if phone is roughly vertical
        const isVertical = Math.abs(z) > 5; // Relaxed condition for testing

        // Update debug info
        setDebugInfo({
            tiltAngle,
            forwardTilt,
            isVertical,
            x,
            y,
            z,
        });

        // Relaxed conditions for testing
        const isNotTiltedForward = Math.abs(forwardTilt) < 8; // More permissive

        if (!isVertical || !isNotTiltedForward) return false;

        // Relaxed angle ranges for testing
        switch (currentView) {
            case 'left':
                if (currentFoot === 'left') {
                    // For left foot outside view, phone should be tilted left
                    return x > 7 && isNotTiltedForward;
                } else {
                    // For right foot outside view, phone should be tilted left
                    return x > 7 && isNotTiltedForward;
                }

            case 'right':
                if (currentFoot === 'left') {
                    // For left foot inside view, phone should be tilted right
                    return x < -7 && isNotTiltedForward;
                } else {
                    // For right foot inside view, phone should be tilted right
                    return x < -7 && isNotTiltedForward;
                }

            case 'top':
                // For front view, phone should be vertical with minimal tilt
                return Math.abs(x) < 0.3 && Math.abs(y) < 0.3 && Math.abs(z) > 9;

            default:
                return false;
        }
    }, [currentView, currentFoot]);

    useEffect(() => {
        let accelerometerSubscription: Subscription;

        const startSensorUpdates = async () => {
            setUpdateIntervalForType(SensorTypes.accelerometer, 100);

            accelerometerSubscription = accelerometer.subscribe(
                ({ x, y, z }: SensorData) => {
                    setIsOrientationCorrect(checkOrientation(x, y, z));
                }
            );
        };

        startSensorUpdates();

        return () => {
            if (accelerometerSubscription) {
                accelerometerSubscription.unsubscribe();
            }
        };
    }, [currentView, checkOrientation]); // Added checkOrientation as dependency


    const handleCapture = async () => {
        if (camera.current) {
            try {
                setIsDetectingSheet(true);
                console.log('Attempting to take photo...');
                const photo = await camera.current.takePhoto({
                    flash: 'off',
                });
                console.log('Photo taken successfully:', photo.path);
                // Check for A4 sheet in the image
                const a4Detected = await sendImageForDetection(photo.path);
                if (!a4Detected) {
                    showAlert('No A4 Sheet Detected', 'Please place your foot on an A4 sheet and try again.', 'error');
                    setIsDetectingSheet(false);
                    return;
                }

                setCurrentImage(photo.path);
                setShowPreview(true);
                showAlert('Success', 'Image captured successfully!', 'success');
            } catch (error) {
                console.error('Error taking photo:', error);
                showAlert('Error', 'Failed to capture image. Please try again.', 'error');
            } finally {
                setIsDetectingSheet(false);
            }
        } else {
            console.error('Camera reference is null');
            showAlert('Error', 'Camera not initialized. Please try again.', 'error');
        }
    };

    const handleRetake = () => {
        setShowPreview(false);
        setCurrentImage(null);
    };

    const handleSave = () => {
        // Only add the image to capturedImages when Save is pressed
        if (currentImage) {
            const newImage: FootImage = {
                path: currentImage,
                type: currentView,
                foot: currentFoot,
            };
            setCapturedImages((prev) => [...prev, newImage]);
        }
        // Move to the next view or foot
        if (currentView === 'top') {
            if (currentFoot === 'right') {
                // We've captured all images
                showAlert('Complete', 'All foot images have been captured!', 'success');
                setShowPreview(false);
                setShowSummary(true);
            } else {
                // Move to the right foot
                setCurrentFoot('right');
                setCurrentView('left');
                setShowPreview(false);
            }
        } else if (currentView === 'right') {
            // Move to the front view
            setCurrentView('top');
            setShowPreview(false);
        } else {
            // Move to the right view
            setCurrentView('right');
            setShowPreview(false);
        }
        setCurrentImage(null);
    };

    const handleRestart = () => {
        setShowSummary(false);
        setCapturedImages([]);
        setCurrentFoot('left');
        setCurrentView('left');
    };

    const uploadImage = async (image: FootImage, timestamp: number): Promise<any> => {
        try {
            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('No authenticated user found during upload');
            }

            await currentUser.getIdToken(true);
            const filename = `${customer.id}/${timestamp}_${image.foot}_${image.type}.jpg`;
            const storageRef = storage().ref(filename);
            const uploadTask = storageRef.putFile(image.path);

            uploadTask.on('state_changed',
                (snapshot: { bytesTransferred: number; totalBytes: number }) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(prev => ({
                        ...prev,
                        [filename]: progress
                    }));
                },
                (error: { code: string; message: string }) => {
                    throw error;
                }
            );

            await uploadTask;
            const url = await storageRef.getDownloadURL();

            return {
                foot: image.foot,
                type: image.type,
                url: url,
                timestamp: timestamp,
            };
        } catch (error: any) {
            if (error.code === 'storage/unauthorized') {
                showAlert('Error', 'Authentication error. Please sign out and sign in again.', 'error');
            }
            throw error;
        }
    };

    const handleContinue = async () => {
        console.log(RetailerId)
        try {
            setIsUploading(true);
            setUploadProgress({});

            const auth = getAuth();
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showAlert('Error', 'Please sign in to upload images', 'error');
                setIsUploading(false);
                return;
            }

            if (!RetailerId) {
                showAlert('Error', 'Retailer ID is required', 'error');
                setIsUploading(false);
                return;
            }

            if (!customer || !customer.id) {
                showAlert('Error', 'Customer information missing', 'error');
                setIsUploading(false);
                return;
            }

            if (capturedImages.length === 0) {
                showAlert('Error', 'No images captured', 'error');
                setIsUploading(false);
                return;
            }

            const timestamp = new Date().getTime();

            // Test storage access
            try {
                const storageInstance = storage();
                const testRef = storageInstance.ref('test-access.txt');
                await testRef.putString('test');
                await testRef.delete();
            } catch (error: any) {
                showAlert('Error', 'Storage access error. Please check your permissions.', 'error');
                setIsUploading(false);
                return;
            }

            const db = getFirestore();
            const existingImagesRef = doc(db, 'Retailers', RetailerId, 'scanned_images', customer.id);

            try {
                const existingImagesDoc = await existingImagesRef.get();
                const existingImages = existingImagesDoc?.data()?.images || [];

                if (existingImages.length > 0) {
                    const storageInstance = storage();
                    const deletePromises = existingImages.map(async (existingImage: any) => {
                        try {
                            const oldFilename = `${customer.id}/${existingImage.timestamp}_${existingImage.foot}_${existingImage.type}.jpg`;
                            const oldReference = storageInstance.ref(oldFilename);
                            await oldReference.delete();
                        } catch (error: any) {
                            // Continue even if deletion fails
                        }
                    });
                    await Promise.all(deletePromises);
                }

                const uploadPromises = capturedImages.map(image => uploadImage(image, timestamp));
                const uploadedImages = await Promise.all(uploadPromises);

                const updateData = {
                    images: uploadedImages,
                    updatedAt: serverTimestamp(),
                    status: 'completed',
                };

                await setDoc(existingImagesRef, updateData, { merge: true });
                showAlert('Success', 'All images have been updated successfully!', 'success');
                setShowWebView(true);
            } catch (error: any) {
                let errorMessage = 'Failed to upload images. ';

                if (error.code === 'storage/unauthorized') {
                    errorMessage += 'Authentication error. Please sign out and sign in again.';
                } else if (error.code === 'storage/canceled') {
                    errorMessage += 'Upload was canceled.';
                } else if (error.code === 'storage/unknown') {
                    errorMessage += 'Network error. Please check your internet connection.';
                } else if (error.code === 'permission-denied') {
                    errorMessage += 'Permission denied. Please check your access rights.';
                } else {
                    errorMessage += error.message || 'Please try again.';
                }

                showAlert('Error', errorMessage, 'error');
            }
        } finally {
            setIsUploading(false);
            setUploadProgress({});
        }
    };

    // Calculate the rotation angle for the movable rectangle
    const getRotation = () => {
        // Keep the rectangle in portrait mode (0 degrees)
        return "0deg";
    };

    const isAligned = isOrientationCorrect; // Use your existing logic

    // Fine-tuned mapping for each view and foot
    const getTranslation = () => {
        let dx = 0;
        let dy = 0;
        const SENSITIVITY_X = 40;
        const SENSITIVITY_Y = 40;

        // When aligned, ensure perfect overlap
        if (isAligned) {
            // Calculate the exact position to match the target rectangle
            const targetX = 0;  // Center position
            const targetY = 0;  // Center position
            return [{ translateX: targetX }, { translateY: targetY }];
        }

        // Calculate offset based on sensor data when not aligned
        // Only use X and Y values for movement, ignore Z
        switch (currentView) {
            case 'left':
                if (currentFoot === 'left') {
                    // For left foot outside view, phone should be tilted left
                    dx = (debugInfo.x - 7.5) * -SENSITIVITY_X;
                } else {
                    // For right foot outside view, phone should be tilted left
                    dx = (debugInfo.x - 7.5) * -SENSITIVITY_X;
                }
                dy = debugInfo.y * -SENSITIVITY_Y;
                break;
            case 'right':
                if (currentFoot === 'left') {
                    // For left foot inside view, phone should be tilted right
                    dx = (debugInfo.x + 7.5) * SENSITIVITY_X;
                } else {
                    // For right foot inside view, phone should be tilted right
                    dx = (debugInfo.x + 7.5) * SENSITIVITY_X;
                }
                dy = debugInfo.y * -SENSITIVITY_Y;
                break;
            case 'top':
                // For front view, phone should be vertical with minimal tilt
                dx = debugInfo.x * (currentFoot === 'left' ? -SENSITIVITY_X : SENSITIVITY_X);
                dy = debugInfo.y * -SENSITIVITY_Y;
                break;
            default:
                dx = debugInfo.x * -SENSITIVITY_X;
                dy = debugInfo.y * -SENSITIVITY_Y;
        }
        return [{ translateX: dx }, { translateY: dy }];
    };

    const renderFootGuide = () => {
        const guideColor = isAligned ? '#4CAF50' : '#FF0000';
        const movingRectColor = isAligned ? '#4CAF50' : 'rgba(255,255,255,0.7)';
        const rectWidth = 220;
        const rectHeight = 310;
        return (
            <View style={[styles.footGuideContainer]}>
                {/* Fixed (target) rectangle */}
                <View
                    style={[
                        styles.targetRectangle,
                        { borderColor: guideColor, width: rectWidth, height: rectHeight }
                    ]}
                />
                {/* Movable rectangle */}
                <Animated.View
                    style={[
                        styles.movingRectangle,
                        {
                            borderColor: movingRectColor,
                            width: rectWidth, height: rectHeight,
                            transform: [
                                ...getTranslation(),
                                { rotate: getRotation() }
                            ]
                        }
                    ]}
                />
                <View style={styles.footGuideHeader}>
                    <Text style={styles.footGuideTitle}>{currentFoot === 'left' ? 'Left' : 'Right'} Foot</Text>
                    <Text style={styles.footGuideSubtitle}>
                        {currentView === 'left' ? 'Left' : currentView === 'right' ? 'Right' : 'Top'} View
                    </Text>
                </View>

            </View>
        );
    };

    const renderCamera = () => {
        if (!device) {
            return (
                <View style={styles.cameraLoadingContainer}>
                    <Text style={styles.cameraLoadingText}>Loading camera...</Text>
                </View>
            );
        }

        if (showPreview && currentImage) {
            return (
                <View style={styles.previewContainer}>
                    <Image
                        source={{ uri: `file://${currentImage}` }}
                        style={styles.previewImage}
                    />
                    <View style={styles.previewButtons}>
                        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                            <Text style={styles.buttonText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.cameraContainer}>
                <Camera
                    ref={camera}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                    enableZoomGesture={true}
                />
                <View style={styles.overlay}>
                    {renderFootGuide()}
                    <View style={styles.floatingMessage}>
                        <Text style={styles.floatingMessageText}>Position your foot closer to the camera for better quality. Avoid white floors for optimal results.</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[
                        styles.captureButton,
                        (!isOrientationCorrect || isDetectingSheet) && styles.disabledButton
                    ]}
                    onPress={handleCapture}
                    disabled={!isOrientationCorrect || isDetectingSheet}
                >
                    <Text style={styles.captureText}>
                        {isDetectingSheet ? 'Detecting...' : 'Capture'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderProgress = () => {
        return (
            <View style={[styles.progressContainer, Platform.OS === 'ios' && styles.progressContainerIOS]}>
                <Text style={[styles.progressTitle, Platform.OS === 'ios' && styles.progressTitleIOS]}>Capture Progress:</Text>
                <View style={styles.progressGrid}>
                    <View style={styles.progressColumn}>
                        <Text style={styles.footLabel}>Left Foot</Text>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'left' && img.type === 'left') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Left View</Text>
                        </View>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'left' && img.type === 'right') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Right View</Text>
                        </View>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'left' && img.type === 'top') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Top View</Text>
                        </View>
                    </View>
                    <View style={styles.progressColumn}>
                        <Text style={styles.footLabel}>Right Foot</Text>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'right' && img.type === 'left') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Left View</Text>
                        </View>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'right' && img.type === 'right') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Right View</Text>
                        </View>
                        <View style={[
                            styles.progressItem,
                            capturedImages.some(img => img.foot === 'right' && img.type === 'top') ? styles.completed : {}
                        ]}>
                            <Text style={styles.progressText}>Top View</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderSummary = () => {
        return (
            <View style={[styles.summaryContainer, Platform.OS === 'ios' && styles.summaryContainerIOS]}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>Foot Scan Summary</Text>
                </View>
                <ScrollView style={styles.summaryScrollView}>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryColumn}>
                            <Text style={styles.summaryFootLabel}>Left Foot</Text>
                            {capturedImages
                                .filter(img => img.foot === 'left')
                                .map((img, index) => (
                                    <View key={`left-${index}`} style={styles.summaryImageContainer}>
                                        <Text style={styles.summaryImageLabel}>{img.type} View</Text>
                                        <Image
                                            source={{ uri: `file://${img.path}` }}
                                            style={styles.summaryImage}
                                        />
                                    </View>
                                ))
                            }
                        </View>
                        <View style={styles.summaryColumn}>
                            <Text style={styles.summaryFootLabel}>Right Foot</Text>
                            {capturedImages
                                .filter(img => img.foot === 'right')
                                .map((img, index) => (
                                    <View key={`right-${index}`} style={styles.summaryImageContainer}>
                                        <Text style={styles.summaryImageLabel}>{img.type} View</Text>
                                        <Image
                                            source={{ uri: `file://${img.path}` }}
                                            style={styles.summaryImage}
                                        />
                                    </View>
                                ))
                            }
                        </View>
                    </View>
                </ScrollView>
                <View style={styles.summaryButtons}>
                    <TouchableOpacity
                        style={styles.restartButton}
                        onPress={handleRestart}
                        disabled={isUploading}
                    >
                        <Text style={styles.buttonText}>Restart</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            isUploading && styles.disabledButton
                        ]}
                        onPress={handleContinue}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={[styles.buttonText, styles.loadingText]}>
                                    {Object.keys(uploadProgress).length > 0
                                        ? `Uploading ${Math.round(Object.values(uploadProgress).reduce((a, b) => a + b, 0) / Object.keys(uploadProgress).length)}%`
                                        : 'Uploading...'}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    <Modal visible={showWebView} animationType="slide">
                        <WebView
                            source={getWebViewSource()}
                            originWhitelist={['*']}
                            style={{ flex: 1 }}
                            onMessage={handleMessage}
                            javaScriptEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
                            // Add iOS specific props
                            {...(Platform.OS === 'ios' && {
                                allowsBackForwardNavigationGestures: true,
                                allowsLinkPreview: false,
                            })}
                        />
                        <View style={[styles.webViewCloseButton, Platform.OS === 'ios' && styles.webViewCloseButtonIOS]}>
                            <Button title="Close" onPress={() => setShowWebView(false)} />
                        </View>
                    </Modal>
                </View>
            </View>
        );
    };

    // Add this new component for the initial popup
    const renderInitialPopup = () => {
        return (
            <Modal
                visible={showInitialPopup}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Important Instructions</Text>
                        <Text style={styles.modalText}>
                            Please take a close-up photo along with A4 page at bottom of your feet to ensure accurate data for custom orthotics
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowInitialPopup(false)}
                        >
                            <Text style={styles.modalButtonText}>I Understand</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    // Function to get the correct WebView source based on platform
    const getWebViewSource = () => {
        if (Platform.OS === 'android') {
            return { uri: 'file:///android_asset/volumental.html' };
        } else {
            // For iOS, we need to use the bundle URL
            return { uri: 'volumental.html' };
        }
    };

    // Modify the main return statement to ensure progress is always rendered
    if (!hasPermission) {
        return (
            <View style={styles.container}>
                {renderInitialPopup()}
                <Text>No access to camera</Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                {renderInitialPopup()}
                <Text>No camera device found</Text>
            </View>
        );
    }

    if (showSummary) {
        return (
            <View style={styles.container}>
                {renderSummary()}
            </View>
        );
    }

    return (
        <View style={[styles.container, Platform.OS === 'ios' && styles.containerIOS]}>
            {renderInitialPopup()}
            <Text style={[styles.title, Platform.OS === 'ios' && styles.titleIOS]}>Scan Your Feet</Text>

            {/* Progress Section - Always render */}
            <View style={styles.progressSection}>
                {renderProgress()}
            </View>

            {/* Camera Section */}
            <View style={styles.cameraSection}>
                {renderCamera()}
            </View>

            <TouchableOpacity
                style={[styles.nextButton, Platform.OS === 'ios' && styles.nextButtonIOS]}
                onPress={() => navigation.goBack()}
            >
                <Text style={[styles.nextText, Platform.OS === 'ios' && styles.nextTextIOS]}>Cancel</Text>
            </TouchableOpacity>
            <CustomAlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={hideAlert}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: Platform.OS === 'ios' ? 50 : 40,
        marginBottom: 10,
    },
    // Progress Section Styles
    progressSection: {
        width: '100%',
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 5,
        backgroundColor: '#fff',
        zIndex: 1, // Ensure progress stays on top
    },
    progressContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        elevation: 2, // Add elevation for Android
        shadowColor: '#000', // Add shadow for iOS
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Camera Section Styles
    cameraSection: {
        flex: 3,
        width: '100%',
        backgroundColor: '#000',
        position: 'relative', // Ensure proper stacking
        overflow: 'hidden', // Add this to contain the camera
    },
    cameraContainer: {
        flex: 1,
        width: '100%',
        position: 'relative',
        backgroundColor: '#000',
    },
    cameraLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    cameraLoadingText: {
        color: '#fff',
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    previewButtons: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
    captureButton: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        alignSelf: 'center',
        backgroundColor: '#00843D',
        padding: 15,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    captureText: {
        color: 'white',
        fontSize: 18,
    },
    nextButton: {
        margin: 5,
        padding: 10,
        backgroundColor: '#00843D',
        borderRadius: 5,
        alignItems: 'center',
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
    },
    permissionButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#00843D',
        borderRadius: 5,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    progressGrid: {
        flexDirection: 'row',
        width: '90%',
        justifyContent: 'space-between',
    },
    progressColumn: {
        alignItems: 'center',
    },
    footLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    progressItem: {
        width: 100,
        height: 30,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderRadius: 5,
    },
    completed: {
        backgroundColor: '#90EE90',
    },
    progressText: {
        fontSize: 12,
    },
    summaryContainer: {
        flex: 1,
        width: '100%',
        padding: 10,
        backgroundColor: '#fff',
    },
    summaryContainerIOS: {
        paddingTop: Platform.OS === 'ios' ? 60 : 10,
    },
    summaryHeader: {
        paddingTop: Platform.OS === 'ios' ? 40 : 30,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000',
    },
    summaryScrollView: {
        flex: 1,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryColumn: {
        width: '45%',
    },
    summaryFootLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    summaryImageContainer: {
        marginBottom: 15,
    },
    summaryImageLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    summaryImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
    },
    summaryButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    restartButton: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 10,
        width: '45%',
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 10,
        width: '45%',
        alignItems: 'center',
    },
    footGuideContainer: {
        marginTop: 30,
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderWidth: 2,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    footGuideHeader: {
        position: 'absolute',
        top: 20,
        alignItems: 'center',
    },
    footGuideTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    footGuideSubtitle: {
        color: 'white',
        fontSize: 18,
        marginTop: 5,
    },
    footOutline: {
        width: '80%',
        height: '60%',
        borderWidth: 2,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    isoText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    debugInfo: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 5,
    },
    debugText: {
        color: 'white',
        fontSize: 12,
        marginVertical: 2,
    },
    targetRectangle: {
        position: 'absolute',
        alignSelf: 'center',
        top: '20%',
        left: '10%',
        borderWidth: 3,
        borderColor: '#FF0000',
        // borderRadius: 8,
        backgroundColor: 'transparent',
    },
    movingRectangle: {
        position: 'absolute',
        alignSelf: 'center',
        top: '20%',
        left: '10%',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
        // borderRadius: 8,
        backgroundColor: 'transparent',
    },
    floatingMessage: {
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgb(0, 0, 0)',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        alignItems: 'center',
    },
    floatingMessageText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    loadingText: {
        fontSize: 16,
        marginLeft: 10,
        color: '#fff',
        flexShrink: 1,
    },
    // iOS specific styles
    containerIOS: {
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
    },
    titleIOS: {
        fontSize: 28,
        marginTop: 20,
    },
    progressContainerIOS: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    progressTitleIOS: {
        fontSize: 18,
    },
    nextButtonIOS: {
        marginBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    nextTextIOS: {
        fontSize: 18,
    },
    webViewCloseButton: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    webViewCloseButtonIOS: {
        bottom: 40, // More space from bottom on iOS
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        width: '80%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#00843D',
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    modalButton: {
        backgroundColor: '#00843D',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 10,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    retakeButton: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 50,
        width: 120,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 50,
        width: 120,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
    },
});

export default FootScanScreen;