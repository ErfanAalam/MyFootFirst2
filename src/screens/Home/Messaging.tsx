import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Image,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Platform
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../../contexts/UserContext';
import { useNavigation } from '@react-navigation/native';

// Define TypeScript interfaces for better type safety
interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    timestamp: any;
    messageCount: number;
    unreadCount: number;
    partnerId: string;
}

interface Retailer {
    id: string;
    uid: string;
    businessName: string;
}

interface Message {
    id: string;
    from: string;
    to: string;
    text: string;
    timestamp: any;
    fromName: string;
    toName: string;
}

const Messaging: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [retailers, setRetailers] = useState<Retailer[]>([]);
    const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const { userData } = useUser();
    const navigation = useNavigation();

    // Fetch all conversations and their message counts
    useEffect(() => {
        let unsubscribeReceived: (() => void) | undefined;
        let unsubscribeSent: (() => void) | undefined;

        if (!userData?.id) return;

        setLoading(true);

        const fetchConversations = async () => {
            try {
                // Track conversations both for received and sent messages
                const conversationMap = new Map<string, Conversation>();

                // Fetch received messages
                const receivedQueryRef = firestore()
                    .collection('messages')
                    .where('to', '==', userData.id)
                    .orderBy('timestamp', 'desc');

                // Fetch sent messages
                const sentQueryRef = firestore()
                    .collection('messages')
                    .where('from', '==', userData.id)
                    .orderBy('timestamp', 'desc');

                // Handle received messages
                unsubscribeReceived = receivedQueryRef.onSnapshot(
                    (snapshot) => {
                        if (!snapshot.empty) {
                            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);

                            msgs.forEach(message => {
                                const partnerId = message.from;
                                const partnerName = message.fromName;

                                if (!conversationMap.has(partnerId)) {
                                    conversationMap.set(partnerId, {
                                        id: partnerId,
                                        name: partnerName,
                                        lastMessage: message.text,
                                        timestamp: message.timestamp,
                                        messageCount: 0,
                                        unreadCount: 0,
                                        partnerId: partnerId
                                    });
                                } else {
                                    const existingConvo = conversationMap.get(partnerId);
                                    if (existingConvo) {
                                        conversationMap.set(partnerId, {
                                            ...existingConvo,
                                            messageCount: existingConvo.messageCount + 1,
                                            unreadCount: existingConvo.unreadCount + 1,
                                            lastMessage: message.text,
                                            timestamp: message.timestamp
                                        });
                                    }
                                }
                            });
                        }

                        // Handle sent messages
                        unsubscribeSent = sentQueryRef.onSnapshot(
                            (sentSnapshot) => {
                                if (!sentSnapshot.empty) {
                                    const sentMsgs = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);

                                    sentMsgs.forEach(message => {
                                        const partnerId = message.to;
                                        const partnerName = message.toName;

                                        if (!conversationMap.has(partnerId)) {
                                            conversationMap.set(partnerId, {
                                                id: partnerId,
                                                name: partnerName,
                                                lastMessage: message.text,
                                                timestamp: message.timestamp,
                                                messageCount: 1,
                                                unreadCount: 0,
                                                partnerId: partnerId
                                            });
                                        } else {
                                            const existingConvo = conversationMap.get(partnerId);
                                            if (existingConvo) {
                                                conversationMap.set(partnerId, {
                                                    ...existingConvo,
                                                    messageCount: existingConvo.messageCount + 1,
                                                    lastMessage: message.text,
                                                    timestamp: message.timestamp
                                                });
                                            }
                                        }
                                    });
                                }

                                // Convert map to array and sort by timestamp (newest first)
                                const conversationsArray = Array.from(conversationMap.values())
                                    .sort((a, b) => {
                                        if (!a.timestamp) return 1;
                                        if (!b.timestamp) return -1;
                                        return (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0);
                                    });

                                setConversations(conversationsArray);
                                setLoading(false);
                            },
                            (error) => {
                                console.error('❌ Firestore sent messages onSnapshot error:', error);
                                setLoading(false);
                            }
                        );
                    },
                    (error) => {
                        console.error('❌ Firestore received messages onSnapshot error:', error);
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error('❌ Failed to set up snapshot listener:', err);
                setLoading(false);
            }
        };

        fetchConversations();

        return () => {
            if (unsubscribeReceived) unsubscribeReceived();
            if (unsubscribeSent) unsubscribeSent();
        };
    }, [userData?.id]);

    // Fetch messages for a specific conversation when selected
    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        if (!userData?.id || !selectedConversation) {
            setConversationMessages([]);
            return;
        }

        setLoading(true);

        const fetchMessages = async () => {
            try {
                // Get messages between the current user and selected partner in both directions
                const queryRef = firestore()
                    .collection('messages')
                    .where('from', 'in', [userData.id, selectedConversation.id])
                    .where('to', 'in', [userData.id, selectedConversation.id])
                    .orderBy('timestamp', 'desc');

                unsubscribe = queryRef.onSnapshot(
                    (snapshot) => {
                        if (!snapshot.empty) {
                            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Message);
                            setConversationMessages(msgs);
                        } else {
                            setConversationMessages([]);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('❌ Firestore onSnapshot error for conversation:', error);
                        setConversationMessages([]);
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error('❌ Failed to set up conversation snapshot listener:', err);
                setConversationMessages([]);
                setLoading(false);
            }
        };

        fetchMessages();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedConversation, userData?.id]);

    // const openCompose = async () => {
    //     setModalVisible(true);
    //     setLoading(true);

    //     try {
    //         const snap = await firestore().collection('Retailers').get();
    //         const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Retailer);
    //         setRetailers(data);
    //     } catch (error) {
    //         console.error('❌ Failed to fetch retailers:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const sendMessage = async () => {
    //     if (!selectedRetailer || !messageText.trim()) return;

    //     setLoading(true);

    //     try {
    //         await firestore().collection('messages').add({
    //             from: userData?.id,
    //             to: selectedRetailer?.uid,
    //             text: messageText.trim(),
    //             timestamp: firestore.FieldValue.serverTimestamp(),
    //             fromName: userData?.contactName,
    //             toName: selectedRetailer?.businessName,
    //         });

    //         setMessageText('');
    //         setSelectedRetailer(null);
    //         setModalVisible(false);
    //     } catch (error) {
    //         console.error('❌ Failed to send message:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const sendReply = async () => {
        if (!selectedConversation || !messageText.trim()) return;

        setLoading(true);

        try {
            await firestore().collection('messages').add({
                from: userData?.id,
                to: selectedConversation.id,
                text: messageText.trim(),
                timestamp: firestore.FieldValue.serverTimestamp(),
                fromName: userData?.contactName,
                toName: selectedConversation.name,
            });

            setMessageText('');
        } catch (error) {
            console.error('❌ Failed to send reply:', error);
        } finally {
            setLoading(false);
        }
    };

    const backToConversations = () => {
        setSelectedConversation(null);
        setMessageText('');
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp || !timestamp.toDate) return '';

        const date = timestamp.toDate();
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            // Today: show time
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (date.getFullYear() === now.getFullYear()) {
            // This year: show month and day
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
            // Different year: show date with year
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    // Render conversation list view
    const renderConversationList = () => (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.conversationTitle}>Messages</Text>
                <View style={styles.spacer} />
            </View>

            {/* Compose Button */}
            {/* <TouchableOpacity onPress={openCompose} style={styles.composeButton}>
                <Text style={styles.composeButtonText}>✍️ Compose New Message</Text>
            </TouchableOpacity> */}

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={() => (
                        <Text style={styles.emptyText}>
                            No conversations yet.
                        </Text>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.conversationItem}
                            onPress={() => setSelectedConversation(item)}
                        >
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.name ? item.name[0].toUpperCase() : '?'}</Text>
                            </View>
                            <View style={styles.conversationContent}>
                                <View style={styles.conversationHeader}>
                                    <Text style={styles.conversationName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.conversationTime}>
                                        {formatTime(item.timestamp)}
                                    </Text>
                                </View>
                                <View style={styles.conversationFooter}>
                                    <Text style={styles.conversationPreview} numberOfLines={1}>
                                        {item.lastMessage}
                                    </Text>
                                    {item.unreadCount > 0 && (
                                        <View style={styles.messageCountBadge}>
                                            <Text style={styles.messageCountText}>
                                                {item.unreadCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );

    // Render the conversation detail view
    const renderConversationDetail = () => (
        <View style={styles.container}>
            <View style={styles.conversationHeader}>
                <TouchableOpacity onPress={backToConversations} style={styles.backButton}>
                    <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/130/130882.png' }} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.conversationTitle}>{selectedConversation?.name}</Text>
                <View style={styles.spacer} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
            ) : (
                <FlatList
                    data={conversationMessages}
                    keyExtractor={item => item.id}
                    inverted
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={() => (
                        <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                    )}
                    renderItem={({ item }) => {
                        const isFromMe = item.from === userData?.id;
                        return (
                            <View style={[
                                styles.messageContainer,
                                isFromMe ? styles.sentMessage : styles.receivedMessage
                            ]}>
                                <View style={[
                                    styles.messageBubble,
                                    isFromMe ? styles.sentBubble : styles.receivedBubble
                                ]}>
                                    <Text style={[
                                        styles.messageText,
                                        isFromMe ? styles.sentMessageText : styles.receivedMessageText
                                    ]}>{item.text}</Text>
                                </View>
                                <View style={styles.messageMetadata}>
                                    <Text style={[
                                        styles.messageTime,
                                        isFromMe ? styles.sentTime : styles.receivedTime
                                    ]}>
                                        {formatTime(item.timestamp)}
                                    </Text>
                                    <Text style={[
                                        styles.messageAuthor,
                                        isFromMe ? styles.sentAuthor : styles.receivedAuthor
                                    ]}>
                                        {isFromMe ? 'You' : item.fromName}
                                    </Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}

            {/* Reply input */}
            <View style={styles.replyContainer}>
                <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    style={styles.replyInput}
                    placeholder="Type your message..."
                    multiline
                />
                <TouchableOpacity
                    onPress={sendReply}
                    style={[
                        styles.sendButton,
                        !messageText.trim() && styles.disabledButton
                    ]}
                    disabled={!messageText.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    // Compose Modal
    // const renderComposeModal = () => (
    //     <Modal visible={modalVisible} animationType="slide" transparent>
    //         <View style={styles.modalBackground}>
    //             <View style={styles.modalContent}>
    //                 <Text style={styles.modalTitle}>New Message</Text>

    //                 <View style={styles.modalSection}>
    //                     <Text style={styles.modalLabel}>Select Retailer:</Text>
    //                     {loading ? (
    //                         <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />
    //                     ) : (
    //                         <FlatList
    //                             data={retailers}
    //                             keyExtractor={item => item.id}
    //                             ListEmptyComponent={() => (
    //                                 <Text style={styles.emptyText}>No retailers found.</Text>
    //                             )}
    //                             renderItem={({ item }) => (
    //                                 <TouchableOpacity
    //                                     onPress={() => setSelectedRetailer(item)}
    //                                     style={[
    //                                         styles.retailerItem,
    //                                         selectedRetailer?.id === item.id && styles.selectedRetailerItem
    //                                     ]}
    //                                 >
    //                                     <Text style={[
    //                                         styles.retailerName,
    //                                         selectedRetailer?.id === item.id && styles.selectedRetailerName
    //                                     ]}>
    //                                         {item.businessName}
    //                                     </Text>
    //                                 </TouchableOpacity>
    //                             )}
    //                         />
    //                     )}
    //                 </View>

    //                 <View style={styles.modalSection}>
    //                     <Text style={styles.modalLabel}>Message:</Text>
    //                     <TextInput
    //                         multiline
    //                         value={messageText}
    //                         onChangeText={setMessageText}
    //                         style={styles.messageInput}
    //                         placeholder="Type your message here..."
    //                     />
    //                 </View>

    //                 <View style={styles.modalButtons}>
    //                     <TouchableOpacity
    //                         onPress={() => {
    //                             setModalVisible(false);
    //                             setSelectedRetailer(null);
    //                             setMessageText('');
    //                         }}
    //                         style={styles.cancelButton}
    //                     >
    //                         <Text style={styles.cancelButtonText}>Cancel</Text>
    //                     </TouchableOpacity>
    //                     <TouchableOpacity
    //                         onPress={sendMessage}
    //                         style={[
    //                             styles.confirmButton,
    //                             (!selectedRetailer || !messageText.trim()) && styles.disabledButton
    //                         ]}
    //                         disabled={!selectedRetailer || !messageText.trim() || loading}
    //                     >
    //                         {loading ? (
    //                             <ActivityIndicator size="small" color="#FFFFFF" />
    //                         ) : (
    //                             <Text style={styles.confirmButtonText}>Send</Text>
    //                         )}
    //                     </TouchableOpacity>
    //                 </View>
    //             </View>
    //         </View>
    //     </Modal>
    // );

    return (
        <>
            {selectedConversation ? renderConversationDetail() : renderConversationList()}
            {/* {renderComposeModal()} */}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F8F8F8',
        marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        color: '#333'
    },
    composeButton: {
        alignSelf: 'flex-end',
        marginBottom: 16,
        backgroundColor: '#00843D',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    composeButtonText: {
        color: '#FFF',
        fontWeight: '600'
    },
    conversationItem: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    conversationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    messageCountBadge: {
        backgroundColor: '#00843D',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8
    },
    messageCountText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold'
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#00843D',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold'
    },
    conversationContent: {
        flex: 1
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conversationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    conversationTime: {
        fontSize: 12,
        color: '#777',
        marginLeft: 8
    },
    conversationPreview: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
        flex: 1
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 40,
        fontSize: 16
    },
    loading: {
        marginTop: 40
    },
    spacer: {
        width: 44
    },
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12
    },
    backButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600'
    },
    conversationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center'
    },
    messagesList: {
        padding: 12
    },
    messageContainer: {
        marginVertical: 6,
        maxWidth: '80%',
        alignSelf: 'flex-start'
    },
    sentMessage: {
        alignSelf: 'flex-end'
    },
    receivedMessage: {
        alignSelf: 'flex-start'
    },
    sentMessageText: {
        color: '#FFFFFF'
    },
    receivedMessageText: {
        color: '#333333'
    },
    messageBubble: {
        padding: 12,
        borderRadius: 18
    },
    sentBubble: {
        backgroundColor: '#00843D',
        borderBottomRightRadius: 4
    },
    receivedBubble: {
        backgroundColor: '#E5E5EA',
        borderBottomLeftRadius: 4
    },
    messageText: {
        fontSize: 16,
        color: '#333'
    },
    messageTime: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: 'flex-end',
        color: '#888'
    },
    sentTime: {
        color: '#00843D'
    },
    receivedTime: {
        color: '#888'
    },
    replyContainer: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0'
    },
    replyInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        backgroundColor: '#F5F5F5'
    },
    sendButton: {
        backgroundColor: '#00843D',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    sendButtonText: {
        color: '#FFF',
        fontWeight: '600'
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16
    },
    modalSection: {
        marginBottom: 16
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    retailersList: {
        maxHeight: 150,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8
    },
    retailerItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    selectedRetailerItem: {
        backgroundColor: '#E8F1FF'
    },
    retailerName: {
        fontSize: 15,
        color: '#333'
    },
    selectedRetailerName: {
        fontWeight: '600',
        color: '#007AFF'
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        backgroundColor: '#F9F9F9'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 12
    },
    cancelButtonText: {
        color: '#FF3B30',
        fontWeight: '600'
    },
    confirmButton: {
        backgroundColor: '#00843D',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: '600'
    },
    disabledButton: {
        opacity: 0.5
    },
    backIcon: {
        width: 20,
        height: 20,
    },
    messageMetadata: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4
    },
    messageAuthor: {
        fontSize: 10,
        color: '#666'
    },
    sentAuthor: {
        color: '#00843D'
    },
    receivedAuthor: {
        color: '#666'
    },
});

export default Messaging;