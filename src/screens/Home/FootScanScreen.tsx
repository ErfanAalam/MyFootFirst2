import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Image, ScrollView, Animated, Platform, Button, Modal, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accelerometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { Subscription } from 'rxjs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import CustomAlertModal from '../../Components/CustomAlertModal';


// Define the types for our foot images
type FootImage = {
    path: string;
    type: 'left' | 'right' | 'front';
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
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentFoot, setCurrentFoot] = useState<'left' | 'right'>('left');
    const [currentView, setCurrentView] = useState<'left' | 'right' | 'front'>('left');
    const [isOrientationCorrect, setIsOrientationCorrect] = useState(false);
    const [isDetectingSheet, setIsDetectingSheet] = useState(false);
    const navigation = useNavigation();
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const camera = useRef<Camera>(null);
    const { width, height } = Dimensions.get('window');

    const route = useRoute();
    const { customer, RetailerId } = route.params as FootScanScreenParams;

    // console.log(customer,RetailerId);


    // volumental webview page
    const [showWebView, setShowWebView] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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
                const user = auth().currentUser;

                if (!user) {
                    throw new Error('User not authenticated');
                }

                // Check if measurements already exist and update instead of creating new
                const measurementsRef = firestore()
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
                    storedAt: firestore.FieldValue.serverTimestamp(),
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

            case 'front':
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
        if (currentView === 'front') {
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
            setCurrentView('front');
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

    const handleContinue = async () => {
        try {
            setIsUploading(true);

            if (!RetailerId) {
                showAlert('Error', 'User not authenticated', 'error');
                return;
            }

            const timestamp = new Date().getTime();
            const uploadedImages = [];

            // First, check for existing images
            const existingImagesRef = firestore()
                .collection('Retailers')
                .doc(RetailerId)
                .collection('scanned_images')
                .orderBy('createdAt', 'desc')
                .limit(1);

            const existingImagesSnapshot = await existingImagesRef.get();
            const existingImagesDoc = existingImagesSnapshot.docs[0];
            const existingImages = existingImagesDoc?.data()?.images || [];

            // Delete existing images from Firebase Storage
            for (const existingImage of existingImages) {
                try {
                    const oldFilename = `${customer.id}/${existingImage.timestamp}_${existingImage.foot}_${existingImage.type}.jpg`;
                    const oldReference = storage().ref(oldFilename);
                    await oldReference.delete();
                } catch (error) {
                    console.warn('Error deleting old image:', error);
                    // Continue with upload even if deletion fails
                }
            }

            // Upload new images to Firebase Storage
            for (const image of capturedImages) {
                try {
                    const filename = `${customer.id}/${timestamp}_${image.foot}_${image.type}.jpg`;
                    const reference = storage().ref(filename);

                    await reference.putFile(image.path);
                    const url = await reference.getDownloadURL();

                    uploadedImages.push({
                        foot: image.foot,
                        type: image.type,
                        url: url,
                        timestamp: timestamp,
                    });
                } catch (error) {
                    console.error('Error uploading image:', error);
                    throw new Error(`Failed to upload ${image.foot} foot ${image.type} view`);
                }
            }

            // Update or create new document in Firestore
            if (existingImagesDoc) {
                // Update existing document
                await existingImagesDoc.ref.update({
                    images: uploadedImages,
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                    status: 'completed',
                });
            } else {
                // Create new document
                await firestore()
                    .collection('Retailers')
                    .doc(RetailerId)
                    .collection('scanned_images')
                    .doc(customer.id)
                    .set({
                        images: uploadedImages,
                        createdAt: firestore.FieldValue.serverTimestamp(),
                        status: 'completed',
                    });
            }

            showAlert('Success', 'All images have been updated successfully!', 'success');
            setShowWebView(true);
        } catch (error) {
            console.error('Error in handleContinue:', error);
            showAlert('Error', 'Failed to upload images. Please try again.', 'error');
        } finally {
            setIsUploading(false);
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
            case 'front':
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
                    <Text style={styles.footGuideTitle}>{currentFoot === 'left' ? 'Left' : 'Right'} foot</Text>
                    <Text style={styles.footGuideSubtitle}>
                        {currentView === 'left' ? 'Outside' : currentView === 'right' ? 'Inside' : 'Top'} view
                    </Text>
                </View>

            </View>
        );
    };

    const renderCamera = () => {
        if (!device) {
            return <Text>Loading camera...</Text>;
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
                        // disabled={!isOrientationCorrect}
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
                    style={[styles.camera, { width, height }]}
                    device={device}
                    isActive={true}
                    photo={true}
                    enableZoomGesture={true}
                />
                <View style={styles.overlay}>
                    {renderFootGuide()}
                    <View style={styles.floatingMessage}>
                        <Text style={styles.floatingMessageText}>Please take the image from closer to get better quality</Text>
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
            <SafeAreaProvider>
                <View style={styles.progressContainer}>
                    <Text style={styles.progressTitle}>Capture Progress:</Text>
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
                                capturedImages.some(img => img.foot === 'left' && img.type === 'front') ? styles.completed : {}
                            ]}>
                                <Text style={styles.progressText}>Front View</Text>
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
                                capturedImages.some(img => img.foot === 'right' && img.type === 'front') ? styles.completed : {}
                            ]}>
                                <Text style={styles.progressText}>Front View</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaProvider>
        );
    };

    const renderSummary = () => {
        return (
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Foot Scan Summary</Text>
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
                                <ActivityIndicator color="white" />
                                <Text style={[styles.buttonText, styles.loadingText]}>Uploading...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>Continue</Text>
                        )}
                    </TouchableOpacity>

                    <Modal visible={showWebView} animationType="slide">
                        <WebView
                            source={{ uri: 'file:///android_asset/volumental.html' }}
                            originWhitelist={['*']}
                            style={{ flex: 1 }}
                            onMessage={handleMessage}
                            javaScriptEnabled={true}
                            allowsInlineMediaPlayback={true}
                            mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
                        />
                        <Button title="Close" onPress={() => setShowWebView(false)} />
                    </Modal>
                </View>
            </View>
        );
    };

    if (!hasPermission) {
        return (
            <View style={styles.container}>
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
        <View style={styles.container}>
            <Text style={styles.title}>Scan Your Feet</Text>
            {renderProgress()}
            {renderCamera()}
            <TouchableOpacity
                style={styles.nextButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.nextText}>Cancel</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    cameraContainer: {
        flex: 3,
        width: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boundary: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: 'red',
        borderRadius: 10,
    },
    instructionText: {
        position: 'absolute',
        top: -80,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 5,
    },
    viewText: {
        position: 'absolute',
        top: 60,
        color: 'white',
        fontSize: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 5,
    },
    captureButton: {
        position: 'absolute',
        bottom: 20,
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 50,
    },
    captureText: {
        color: 'white',
        fontSize: 18,
    },
    nextButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#00843D',
        borderRadius: 5,
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
    previewContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
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
    progressContainer: {
        width: '100%',
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginBottom: 10,
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
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
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
        position: 'absolute',
        width: '90%',
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    },
    loadingText: {
        marginLeft: 10,
    },
});

export default FootScanScreen;