import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    Platform,
    StatusBar,
    Modal
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/FontAwesome5';
// import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFirestore } from '@react-native-firebase/firestore';
import { getApp } from 'firebase/app';
import { useUser } from '../../contexts/UserContext';
import Icon from 'react-native-vector-icons/FontAwesome';
// Sample data - replace with your actual data source
const sampleOrderData = {
    currentMonth: 256,
    lastSevenDays: [
        { day: 'Mon', orders: 30 },
        { day: 'Tue', orders: 35 },
        { day: 'Wed', orders: 40 },
        { day: 'Thu', orders: 32 },
        { day: 'Fri', orders: 38 },
        { day: 'Sat', orders: 36 },
        { day: 'Sun', orders: 45 }
    ],
    lastTwelveMonths: [
        { month: 'May', orders: 180 },
        { month: 'Jun', orders: 200 },
        { month: 'Jul', orders: 220 },
        { month: 'Aug', orders: 190 },
        { month: 'Sep', orders: 210 },
        { month: 'Oct', orders: 230 },
        { month: 'Nov', orders: 250 },
        { month: 'Dec', orders: 270 },
        { month: 'Jan', orders: 230 },
        { month: 'Feb', orders: 240 },
        { month: 'Mar', orders: 250 },
        { month: 'Apr', orders: 256 }
    ]
};

const sampleRevenueData = {
    currentRevenue: 12680,
    lastSevenDays: [
        { day: 'Mon', revenue: 1800 },
        { day: 'Tue', revenue: 1600 },
        { day: 'Wed', revenue: 1750 },
        { day: 'Thu', revenue: 1900 },
        { day: 'Fri', revenue: 1700 },
        { day: 'Sat', revenue: 1800 },
        { day: 'Sun', revenue: 2130 }
    ],
    lastTwelveMonths: [
        { month: 'May', revenue: 9000 },
        { month: 'Jun', revenue: 10000 },
        { month: 'Jul', revenue: 11000 },
        { month: 'Aug', revenue: 9500 },
        { month: 'Sep', revenue: 10500 },
        { month: 'Oct', revenue: 11500 },
        { month: 'Nov', revenue: 12500 },
        { month: 'Dec', revenue: 13500 },
        { month: 'Jan', revenue: 11500 },
        { month: 'Feb', revenue: 12000 },
        { month: 'Mar', revenue: 12500 },
        { month: 'Apr', revenue: 12680 }
    ]
};

const sampleOrders = [
    { id: '1', customer: 'Susan Smith', product: 'Comfort', date: '22 April 2025', status: 'Delivered' },
    { id: '2', customer: 'John Doe', product: 'Sport', date: '20 April 2025', status: 'Processing' },
    { id: '3', customer: 'Mary Johnson', product: 'Stability', date: '18 April 2025', status: 'Shipped' },
    { id: '4', customer: 'Robert Brown', product: 'Comfort', date: '15 April 2025', status: 'Delivered' }
];


// Get screen width for responsive charts
const screenWidth = Dimensions.get('window').width - 40;

const Dashboard = () => {
    const { userData } = useUser();
    const [activeTab, setActiveTab] = useState('active');
    const [markup, setMarkup] = useState({
        Sport: '20',
        Comfort: '25',
        Stability: '22'
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeeRole, setEmployeeRole] = useState('');
    const [selectedRange, setSelectedRange] = useState('12m');
    const [selectedRangeRevenue, setSelectedRangeRevenue] = useState('12m');
    const [selectedValue, setSelectedValue] = useState<null | { value: number, x: number, y: number }>()


    const handleConfirm = async () => {
        try {
            const db = getFirestore()

            if (!userData?.id) {
                console.error("Retailer ID not found.");
                return;
            }

            let doc = (userData.businessName.toLocaleLowerCase())
            const retailerRef = db.collection('Retailers').doc(doc);

            const newEmployee = {
                name: employeeName,
                email: employeeEmail,
                role: employeeRole
            };

            // Add new employee to the array of employees using arrayUnion
            await retailerRef.update({
                employees: [...(userData?.employees ?? []), newEmployee]
            });

            console.log('Employee added:', newEmployee);

            setModalVisible(false);
            setEmployeeName('');
            setEmployeeEmail('');
            setEmployeeRole('');
        } catch (error) {
            console.error("Error adding employee:", error);
        }
    };

    const getFilteredData = () => {
        if (selectedRange === '7d') {
            return sampleOrderData.lastSevenDays.map(item => ({
                label: item.day,
                orders: item.orders
            }));
        }

        const months = sampleOrderData.lastTwelveMonths;
        let sliced;

        switch (selectedRange) {
            case '1m':
                sliced = months.slice(-1);
                break;
            case '3m':
                sliced = months.slice(-3);
                break;
            case '6m':
                sliced = months.slice(-6);
                break;
            case '12m':
            default:
                sliced = months;
        }

        return sliced.map(item => ({
            label: item.month.substring(0, 3),
            orders: item.orders
        }));
    };


    // Format chart data for react-native-chart-kit
    const filtered = getFilteredData();

    const barChartData = {
        labels: filtered.map(item => item.label),
        datasets: [{ data: filtered.map(item => item.orders) }]
    };

    const getFilteredRevenueData = () => {
        if (selectedRangeRevenue === '7d') {
            return sampleRevenueData.lastSevenDays.map(item => ({
                label: item.day,
                revenue: item.revenue
            }));
        }

        const months = sampleRevenueData.lastTwelveMonths;
        let sliced;

        switch (selectedRangeRevenue) {
            case '1m':
                sliced = months.slice(-1);
                break;
            case '3m':
                sliced = months.slice(-3);
                break;
            case '6m':
                sliced = months.slice(-6);
                break;
            case '12m':
            default:
                sliced = months;
        }

        return sliced.map(item => ({
            label: item.month.substring(0, 3),
            revenue: item.revenue
        }));
    };

    const filteredRevenueData = getFilteredRevenueData();

    const lineChartData = {
        labels: filteredRevenueData.map(item => item.label),
        datasets: [
            {
                data: filteredRevenueData.map(item => item.revenue)
            }
        ]
    };

    // Products data
    const products = [
        { name: 'Sport', basePrice: '$45', shippingFee: '$5' },
        { name: 'Comfort', basePrice: '$45', shippingFee: '$5' },
        { name: 'Stability', basePrice: '$45', shippingFee: '$5' }
    ];

    // Render status with appropriate color
    const renderStatus = (status: string) => {
        let color;
        switch (status) {
            case 'Delivered':
                color = '#4CAF50';
                break;
            case 'Processing':
                color = '#FF9800';
                break;
            case 'Shipped':
                color = '#2196F3';
                break;
            default:
                color = '#333';
        }

        return (
            <Text style={[styles.tableCell, { color }]}>{status}</Text>
        );
    };

    // console.log(selectedValue)

    return (
        <SafeAreaView style={{ flex: 1 }} >
            <StatusBar barStyle="dark-content" />
            <View style={{ backgroundColor: '#00843D', height: Platform.OS === 'android' ? StatusBar.currentHeight : 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>DashBoard</Text>
            </View>
            <ScrollView style={styles.container}>
                {/* Metrics Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Metrics</Text>

                    {/* Orders Placed */}
                    <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>Orders Placed</Text>
                        <Text style={styles.bigNumber}>{sampleOrderData.currentMonth}</Text>
                        <View style={styles.rangeSelector}>
                            {['7d', '1m', '3m', '6m', '12m'].map(range => (
                                <TouchableOpacity
                                    key={range}
                                    style={[
                                        styles.rangeButton,
                                        selectedRange === range && styles.selectedRangeButton
                                    ]}
                                    onPress={() => setSelectedRange(range)}
                                >
                                    <Text style={styles.rangeText}>{range.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.subText}>This month</Text>

                        <View style={styles.chartContainer}>
                            <BarChart
                                data={barChartData}
                                width={screenWidth - 20}
                                height={180}
                                yAxisLabel=""
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    }
                                }}
                                showValuesOnTopOfBars={true}
                                style={styles.chart}
                            />
                        </View>
                    </View>

                    {/* Revenue Earned */}
                    <View style={styles.metricCard}>
                        <Text style={styles.metricTitle}>Revenue Earned (€)</Text>
                        <Text style={styles.bigNumber}>{sampleRevenueData.currentRevenue}</Text>

                        <View style={styles.rangeSelector}>
                            {['7d', '1m', '3m', '6m', '12m'].map(range => (
                                <TouchableOpacity
                                    key={range}
                                    style={[
                                        styles.rangeButton,
                                        selectedRangeRevenue === range && styles.selectedRangeButton
                                    ]}
                                    onPress={() => setSelectedRangeRevenue(range)}
                                >
                                    <Text style={styles.rangeText}>{range.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.subText}>This month</Text>

                        <View style={styles.chartContainer}>
                            {selectedValue && (
                                <Text style={{ position: 'absolute', top: selectedValue.y - 30, left: selectedValue.x - 20, zIndex: 1000, backgroundColor: 'white', color: 'black', padding: 4, borderRadius: 4 }}>
                                    €{selectedValue.value}
                                </Text>
                            )}
                            <LineChart
                                data={lineChartData}
                                width={screenWidth}
                                height={180}
                                yAxisLabel="€"
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "4",
                                        strokeWidth: "2",
                                        stroke: "#4BC0C0"
                                    }
                                }}
                                bezier
                                onDataPointClick={(data) => {
                                    setSelectedValue({ value: data.value, x: data.x, y: data.y });
                                }}
                                style={styles.chart}
                            />
                        </View>
                    </View>
                </View>

                {/* Products and Markup Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Products and Markup</Text>

                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <Text style={styles.headerCell}>Insole</Text>
                        <Text style={styles.headerCell}>Base Price</Text>
                        <Text style={styles.headerCell}>Ship Fee</Text>
                        <Text style={styles.headerCell}>Markup</Text>
                    </View>

                    {/* Product Rows */}
                    {products.map((product, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{product.name}</Text>
                            <Text style={styles.tableCell}>{product.basePrice}</Text>
                            <Text style={styles.tableCell}>{product.shippingFee}</Text>
                            <TextInput
                                style={styles.markupInput}
                                value={markup[product.name as keyof typeof markup]}
                                onChangeText={(text) => {
                                    const updatedMarkup = { ...markup };
                                    updatedMarkup[product.name as keyof typeof markup] = text;
                                    setMarkup(updatedMarkup);
                                }}
                                keyboardType="numeric"
                                placeholder="0"
                            />
                        </View>
                    ))}

                    <Text style={styles.noteText}>
                        Markup used to calculate revenue for yourself. Shoe store just pays Base price and shipping fee to the manufacturer.
                    </Text>
                </View>

                {/* Recent Orders Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                            onPress={() => setActiveTab('active')}
                        >
                            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                            onPress={() => setActiveTab('past')}
                        >
                            <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <Text style={styles.headerCell}>Customer</Text>
                        <Text style={styles.headerCell}>Product</Text>
                        <Text style={styles.headerCell}>Date</Text>
                        <Text style={styles.headerCell}>Status</Text>
                    </View>

                    {/* Order Rows */}
                    {sampleOrders.map((order, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{order.customer}</Text>
                            <Text style={styles.tableCell}>{order.product}</Text>
                            <Text style={styles.tableCell}>{order.date}</Text>
                            {renderStatus(order.status)}
                        </View>
                    ))}


                </View>

                {/* Employees Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Employees Signed Up Using your ID</Text>

                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <Text style={styles.headerCell}>First Name</Text>
                        <Text style={styles.headerCell}>Email</Text>
                        <Text style={styles.headerCell}>Role</Text>
                        <Text style={styles.headerCell}>Actions</Text>
                    </View>

                    {/* Employee Rows */}
                    {userData?.employees?.map((employee, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{employee.name}</Text>
                            <Text style={styles.tableCell} numberOfLines={1} ellipsizeMode="tail">{employee.email}</Text>
                            <Text style={styles.tableCell}>{employee.role}</Text>
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
                                    <Text style={styles.actionButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    {/* Add New User Button */}
                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>+ Add New User</Text>
                    </TouchableOpacity>

                    <Modal
                        animationType="slide"
                        transparent
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Add Employee</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ position: 'absolute', right: 0, top: 0 }}>
                                        <Icon name="close" size={20} color="#000" />
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Employee Name"
                                    value={employeeName}
                                    onChangeText={setEmployeeName}
                                    placeholderTextColor="#000"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Employee Email"
                                    value={employeeEmail}
                                    onChangeText={setEmployeeEmail}
                                    keyboardType="email-address"
                                    placeholderTextColor="#000"
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Employee Role"
                                    value={employeeRole}
                                    onChangeText={setEmployeeRole}
                                    placeholderTextColor="#000"
                                />

                                <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 20,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    metricCard: {
        marginBottom: 20,
    },
    metricTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    bigNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    subText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 15,
    },
    chartContainer: {
        alignItems: 'center',
        marginTop: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 14,
        color: '#666',
    },
    tableCell: {
        flex: 1,
        fontSize: 14,
        color: '#000',
    },
    markupInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        fontSize: 14,
    },
    noteText: {
        fontSize: 12,
        color: '#888',
        marginTop: 10,
        fontStyle: 'italic',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
    },
    activeTab: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    addButton: {
        backgroundColor: '#007AFF',
        borderRadius: 5,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 15,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionButtons: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionButton: {
        backgroundColor: '#007AFF',
        borderRadius: 4,
        paddingVertical: 5,
        paddingHorizontal: 8,
        marginLeft: 5,
    },
    deleteButton: {
        backgroundColor: '#FF3B30', // Red for delete
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
    },
    confirmButton: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    rangeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
    },
    rangeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    selectedRangeButton: {
        backgroundColor: '#007AFF',
    },
    rangeText: {
        color: '#000',
    },
    modalHeader: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
});

export default Dashboard;