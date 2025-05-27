import React, { useState, useEffect } from 'react';
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
    Modal,
    ActivityIndicator
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useUser } from '../../contexts/UserContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAlertModal from '../../Components/CustomAlertModal';

interface OrderData {
    orderId: string;
    customerName: string;
    customerId: string;
    dateOfOrder: number;
    products: Array<{
        id: string;
        title: string;
        price: number;
        priceWithSymbol: string;
        quantity: number;
        image: string;
        totalPrice: number;
    }>;
    totalAmount: number;
    orderStatus: string;
}

interface InsolePricing {
    Active: number;
    Sport: number;
    Comfort: number;
    Shipping: number;
    currency: string;
}

interface Employee {
    name: string;
    email: string;
    role: 'full_access' | 'half_access';
}

interface ExtendedUserData {
    RetailerId: string;
    country: string;
    employees?: Employee[];
}

// Add new interface for date picker modal
interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentDate: Date;
    isStartDate: boolean;
    otherDate: Date;
    showAlert: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

// Update DatePickerModal component
const DatePickerModal = ({
    visible,
    onClose,
    onSelect,
    currentDate,
    isStartDate,
    otherDate,
    showAlert
}: DatePickerModalProps) => {
    const handleDateSelect = (selectedDate: Date) => {
        if (isStartDate) {
            // For start date, check if it's more than 12 months before end date
            const maxStartDate = new Date(otherDate);
            maxStartDate.setMonth(maxStartDate.getMonth() - 12);

            if (selectedDate < maxStartDate) {
                showAlert('Invalid Date', 'Start date cannot be more than 12 months before end date', 'error');
                return;
            }
        } else {
            // For end date, check if it's more than 12 months after start date
            const maxEndDate = new Date(otherDate);
            maxEndDate.setMonth(maxEndDate.getMonth() + 12);

            if (selectedDate > maxEndDate) {
                showAlert('Invalid Date', 'End date cannot be more than 12 months after start date', 'error');
                return;
            }
        }
        onSelect(selectedDate);
        onClose();
    };

    if (!visible) return null;

    return (
        <DateTimePicker
            value={currentDate}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
                if (event.type === 'set' && selectedDate) {
                    handleDateSelect(selectedDate);
                } else {
                    onClose();
                }
            }}
            style={styles.datePicker}
        />
    );
};

const Dashboard = () => {
    const { userData } = useUser() as { userData: ExtendedUserData | null };
    const [markup, setMarkup] = useState({
        Sport: '',
        Active: '',
        Comfort: '',
    });
    const [pricing, setPricing] = useState<InsolePricing | null>(null);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [accessModalVisible, setAccessModalVisible] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeeRole, setEmployeeRole] = useState<'full_access' | 'half_access'>('half_access');

    // Add new state for validation errors
    const [validationErrors, setValidationErrors] = useState({
        name: '',
        email: '',
        role: ''
    });

    // Date range states
    const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    // Add new state for custom alert modal
    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    // Function to show custom alert
    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertModal({
            visible: true,
            title,
            message,
            type,
        });
    };

    // Function to hide custom alert
    const hideAlert = () => {
        setAlertModal(prev => ({ ...prev, visible: false }));
    };

    // Fetch orders data
    useEffect(() => {
        const fetchOrders = async () => {
            if (!userData?.RetailerId) {
                console.log('No RetailerId found in userData');
                return;
            }

            try {
                console.log('Fetching orders for RetailerId:', userData.RetailerId);

                // First, let's check if the customers collection exists and has documents
                const customersRef = firestore()
                    .collection('RetailersOrders')
                    .doc(userData.RetailerId)
                    .collection('customers')

                console.log('Attempting to fetch customers collection...');
                const customersSnapshot = await customersRef.get();


                // Log snapshot details without trying to stringify the entire object
                console.log('Snapshot details:', {
                    empty: customersSnapshot.empty,
                    size: customersSnapshot.size,
                    docs: customersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        exists: doc.exists,
                        data: doc.data()
                    }))
                });

                if (customersSnapshot.empty) {
                    console.log('No customers found in collection');
                    setOrders([]);
                    setLoading(false);
                    return;
                }

                const ordersData: OrderData[] = [];

                // Iterate through each customer's orders with more detailed logging
                for (const customerDoc of customersSnapshot.docs) {
                    console.log('Processing customer document:', {
                        id: customerDoc.id,
                        exists: customerDoc.exists,
                        data: customerDoc.data()
                    });

                    const ordersRef = customerDoc.ref.collection('orders');
                    const ordersSnapshot = await ordersRef.get();

                    console.log(`Found ${ordersSnapshot.docs.length} orders for customer ${customerDoc.id}`);

                    // Log orders snapshot details without stringifying
                    console.log('Orders snapshot details:', {
                        empty: ordersSnapshot.empty,
                        size: ordersSnapshot.size,
                        docs: ordersSnapshot.docs.map(doc => ({
                            id: doc.id,
                            exists: doc.exists,
                            data: doc.data()
                        }))
                    });

                    ordersSnapshot.docs.forEach(orderDoc => {
                        const orderData = orderDoc.data() as OrderData;
                        console.log('Order data:', {
                            id: orderDoc.id,
                            data: orderData
                        });
                        ordersData.push(orderData);
                    });
                }

                console.log('Total orders collected:', ordersData.length);
                setOrders(ordersData);
            } catch (error) {
                console.error('Detailed error fetching orders:', error);
                showAlert('Error', 'Failed to fetch orders. Check console for details.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [userData?.RetailerId]);

    // Fetch pricing data
    useEffect(() => {
        const fetchPricing = async () => {
            if (!userData?.country) return;

            try {
                const pricingDoc = await firestore()
                    .collection('InsolePricing')
                    .doc(userData.country)
                    .get();

                if (pricingDoc.exists) {
                    setPricing(pricingDoc.data() as InsolePricing);
                } else {
                    // Fallback to Ireland pricing
                    const irelandDoc = await firestore()
                        .collection('InsolePricing')
                        .doc('Ireland')
                        .get();

                    if (irelandDoc.exists) {
                        setPricing(irelandDoc.data() as InsolePricing);
                    }
                }
            } catch (error) {
                console.error('Error fetching pricing:', error);
                showAlert('Error', 'Failed to fetch pricing data', 'error');
            }
        };

        fetchPricing();
    }, [userData?.country]);

    // Fetch existing markup
    useEffect(() => {
        const fetchMarkup = async () => {
            if (!userData?.RetailerId) return;

            try {
                const retailerDoc = await firestore()
                    .collection('Retailers')
                    .doc(userData.RetailerId)
                    .get();

                if (retailerDoc.exists) {
                    const data = retailerDoc.data();
                    if (data?.retailerMarkup) {
                        setMarkup(data.retailerMarkup);
                    }
                }
            } catch (error) {
                console.error('Error fetching markup:', error);
            }
        };

        fetchMarkup();
    }, [userData?.RetailerId]);

    const handleMarkupSubmit = async () => {
        if (!userData?.RetailerId) return;

        try {
            await firestore()
                .collection('Retailers')
                .doc(userData.RetailerId)
                .update({
                    retailerMarkup: markup
                });

            showAlert('Success', 'Markup updated successfully', 'success');
        } catch (error) {
            console.error('Error updating markup:', error);
            showAlert('Error', 'Failed to update markup', 'error');
        }
    };

    // Add validation function
    const validateEmployeeData = () => {
        const errors = {
            name: '',
            email: '',
            role: ''
        };
        let isValid = true;

        // Name validation
        if (!employeeName.trim()) {
            errors.name = 'Name is required';
            isValid = false;
        } else if (employeeName.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!employeeEmail.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(employeeEmail.trim())) {
            errors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Role validation
        if (!employeeRole) {
            errors.role = 'Please select an access level';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleConfirm = async () => {
        if (!validateEmployeeData()) {
            return;
        }

        try {
            if (!userData?.RetailerId?.toString()) {
                showAlert('Error', 'Retailer ID not found.', 'error');
                return;
            }

            const retailerRef = firestore().collection('Retailers').doc(userData.RetailerId.toString());
            const retailerDoc = await retailerRef.get();
            const currentEmployees = retailerDoc.data()?.employees || [];

            if (currentEmployees.length >= 3) {
                showAlert('Error', 'Maximum number of employees (3) reached. Please delete an existing employee first.', 'error');
                return;
            }

            const newEmployee: Employee = {
                name: employeeName.trim(),
                email: employeeEmail.trim(),
                role: employeeRole,
            };

            await retailerRef.update({
                employees: [...currentEmployees, newEmployee]
            });

            showAlert('Success', 'Employee added successfully', 'success');
            setModalVisible(false);
            // Reset form
            setEmployeeName('');
            setEmployeeEmail('');
            setEmployeeRole('half_access');
            setValidationErrors({ name: '', email: '', role: '' });
        } catch (error) {
            console.error("Error adding employee:", error);
            showAlert('Error', 'Failed to add employee', 'error');
        }
    };

    const handleDeleteEmployee = async (index: number) => {
        try {
            if (!userData?.RetailerId?.toString()) return;

            const retailerRef = firestore().collection('Retailers').doc(userData.RetailerId.toString());
            const retailerDoc = await retailerRef.get();
            const currentEmployees = retailerDoc.data()?.employees || [];

            const updatedEmployees = currentEmployees.filter((_: any, i: number) => i !== index);

            await retailerRef.update({
                employees: updatedEmployees
            });

            showAlert('Success', 'Employee deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting employee:', error);
            showAlert('Error', 'Failed to delete employee', 'error');
        }
    };

    // Calculate metrics from orders with date filtering
    const calculateMetrics = () => {
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.dateOfOrder);
            return orderDate >= startDate && orderDate <= endDate;
        });

        console.log('Filtered Orders:', JSON.stringify(filteredOrders, null, 2));
        console.log('Pricing Data:', JSON.stringify(pricing, null, 2));
        console.log('Retailer Markup:', JSON.stringify(markup, null, 2));

        const totalOrders = filteredOrders.length;

        // Calculate total profit for each order
        const totalProfit = filteredOrders.reduce((sum, order) => {
            console.log('\nProcessing Order:', order.orderId);
            console.log('Customer:', order.customerName);

            const orderProfit = order.products.reduce((productSum, product) => {
                // Normalize product title by making lowercase and removing "insole" word
                const normalizedTitle = product.title.toLowerCase().replace(' insole', '').charAt(0).toUpperCase() + product.title.toLowerCase().replace(' insole', '').slice(1);
                // Get base price and shipping from pricing data
                const basePrice = Number(pricing?.[normalizedTitle as keyof typeof pricing]) || 0;
                const shippingCost = Number(pricing?.Shipping) || 0;

                // Calculate total cost (base price + shipping) * quantity
                const totalCost = (basePrice + shippingCost) * product.quantity;

                // Get selling price from retailer markup
                const markupValue = Number(markup[normalizedTitle as keyof typeof markup]) || 0;
                // Calculate total revenue (markup * quantity)
                const totalRevenue = markupValue * product.quantity;

                // Calculate profit as total revenue - total cost
                const profit = totalRevenue - totalCost;

                console.log(`\nProduct Details:
                    Original Title: ${product.title}
                    Normalized Title: ${normalizedTitle}
                    Base Price: ${basePrice}
                    Shipping Cost: ${shippingCost}
                    Quantity: ${product.quantity}
                    Total Cost: ${totalCost}
                    Markup Value: ${markupValue}
                    Total Revenue: ${totalRevenue}
                    Profit: ${profit}
                `);

                return productSum + profit;
            }, 0);

            console.log(`Total profit for order ${order.orderId}: ${orderProfit}`);
            return sum + orderProfit;
        }, 0);

        console.log('\nFinal Total Profit:', totalProfit);

        // Calculate date range in days
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Determine the interval based on date range
        let interval: 'day' | 'week' | 'month';
        let dateFormat: Intl.DateTimeFormatOptions;

        if (daysDiff <= 7) {
            interval = 'day';
            dateFormat = { weekday: 'short' };
        } else if (daysDiff <= 31) {
            interval = 'week';
            dateFormat = { month: 'short', day: 'numeric' };
        } else {
            interval = 'month';
            dateFormat = { month: 'short', year: 'numeric' };
        }

        const chartData = {
            labels: [] as string[],
            orders: [] as number[],
            profit: [] as number[]
        };

        // Create date points based on interval
        const datePoints: Date[] = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            datePoints.push(new Date(currentDate));

            switch (interval) {
                case 'day':
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'week':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'month':
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }

        // Aggregate data for each date point
        datePoints.forEach(datePoint => {
            const nextDate = new Date(datePoint);
            switch (interval) {
                case 'day':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'week':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'month':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
            }

            const periodOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.dateOfOrder);
                return orderDate >= datePoint && orderDate < nextDate;
            });

            // Calculate profit for this period using the same logic as total profit
            const periodProfit = periodOrders.reduce((sum, order) => {
                const orderProfit = order.products.reduce((productSum, product) => {
                    const normalizedTitle = product.title.toLowerCase().replace(' insole', '').charAt(0).toUpperCase() + product.title.toLowerCase().replace(' insole', '').slice(1);
                    const basePrice = Number(pricing?.[normalizedTitle as keyof typeof pricing]) || 0;
                    const shippingCost = Number(pricing?.Shipping) || 0;
                    const totalCost = (basePrice + shippingCost) * product.quantity;
                    const markupValue = Number(markup[normalizedTitle as keyof typeof markup]) || 0;
                    const totalRevenue = markupValue * product.quantity;
                    const profit = totalRevenue - totalCost;
                    return productSum + profit;
                }, 0);
                return sum + orderProfit;
            }, 0);

            chartData.labels.push(datePoint.toLocaleDateString('en-US', dateFormat));
            chartData.orders.push(periodOrders.length);
            chartData.profit.push(periodProfit);
        });

        return {
            totalOrders,
            totalProfit,
            chartData,
        };
    };

    const screenWidth = Dimensions.get('window').width - 60;

    // Update chart dot content with correct type
    const renderDotContent = ({ x, y, index: _index, indexData }: { x: number; y: number; index: number; indexData: number }) => (
        <View style={[styles.dotLabel, { left: x - 10, top: y - 20 }]}>
            <Text style={styles.dotLabelText}>
                {indexData >= 1000 ? `${(indexData / 1000).toFixed(1)}k` : indexData}
            </Text>
        </View>
    );

    // Remove unused variables
    const metrics = calculateMetrics();

    // Add back renderStatus function
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

    // Remove unused chartHeight and formatChartLabels variables
    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(0, 132, 61, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        yAxisLabel: '',
        yAxisSuffix: '',
        formatYLabel: (value: string) => {
            const num = parseFloat(value);
            return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
        },
        propsForLabels: {
            fontSize: 12,
            rotation: 0,
            translateX: 0,
            translateY: 0,
        },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#00843D'
        },
        propsForBackgroundLines: {
            strokeDasharray: '', // Solid lines
            stroke: '#E0E0E0',
            strokeWidth: 1,
        },
        decimalPlaces: 0,
        count: 5, // Number of segments on Y axis
        paddingRight: 20,
        paddingTop: 20,
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <View style={{ backgroundColor: '#00843D', height: Platform.OS === 'android' ? StatusBar.currentHeight : 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>Dashboard</Text>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00843D" />
                </View>
            ) : (
                <ScrollView style={styles.container}>
                    {/* Date Range Selector */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Date Range</Text>
                        <View style={styles.dateRangeContainer}>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowStartDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    Start: {startDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowEndDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>
                                    End: {endDate.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.datePickerWrapper}>
                            <DatePickerModal
                                visible={showStartDatePicker}
                                onClose={() => setShowStartDatePicker(false)}
                                onSelect={(date) => setStartDate(date)}
                                currentDate={startDate}
                                isStartDate={true}
                                otherDate={endDate}
                                showAlert={showAlert}
                            />

                            <DatePickerModal
                                visible={showEndDatePicker}
                                onClose={() => setShowEndDatePicker(false)}
                                onSelect={(date) => setEndDate(date)}
                                currentDate={endDate}
                                isStartDate={false}
                                otherDate={startDate}
                                showAlert={showAlert}
                            />
                        </View>
                    </View>

                    {/* Metrics Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Metrics</Text>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricTitle}>Orders Placed</Text>
                            <Text style={styles.bigNumber}>{metrics.totalOrders}</Text>
                            <Text style={styles.subText}>Selected Period</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricTitle}>Total Profit ({pricing?.currency || '€'})</Text>
                            <Text style={styles.bigNumber}>{metrics.totalProfit.toFixed(2)}</Text>
                            <Text style={styles.subText}>Selected Period</Text>
                        </View>
                    </View>

                    {/* Charts Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Orders Over Time</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={{
                                    labels: metrics.chartData.labels,
                                    datasets: [{ data: metrics.chartData.orders }]
                                }}
                                width={screenWidth}
                                height={220}
                                chartConfig={chartConfig}
                                style={styles.chart}
                                bezier
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero
                                segments={4}
                                renderDotContent={renderDotContent}
                            />
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Profit Over Time</Text>
                        <View style={styles.chartContainer}>
                            <LineChart
                                data={{
                                    labels: metrics.chartData.labels,
                                    datasets: [{ data: metrics.chartData.profit }],
                                }}
                                width={screenWidth}
                                height={220}
                                chartConfig={chartConfig}
                                style={styles.chart}
                                bezier
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero
                                segments={4}
                                renderDotContent={renderDotContent}
                            />
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
                        {pricing && ['Sport', 'Active', 'Comfort'].map((product) => (
                            <View key={product} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{product}</Text>
                                <Text style={styles.tableCell}>{pricing.currency}{pricing[product as keyof typeof pricing]}</Text>
                                <Text style={styles.tableCell}>{pricing.currency}{pricing.Shipping}</Text>
                                <TextInput
                                    style={styles.markupInput}
                                    value={markup[product as keyof typeof markup]}
                                    onChangeText={(text) => {
                                        const updatedMarkup = { ...markup };
                                        updatedMarkup[product as keyof typeof markup] = text;
                                        setMarkup(updatedMarkup);
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        ))}

                        <TouchableOpacity style={styles.submitButton} onPress={handleMarkupSubmit}>
                            <Text style={styles.submitButtonText}>Submit Markup</Text>
                        </TouchableOpacity>

                        <Text style={styles.noteText}>
                            Markup used to calculate revenue for yourself. Shoe store just pays Base price and shipping fee to the manufacturer.
                        </Text>
                    </View>

                    {/* Recent Orders Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>

                        {/* Table Header */}
                        <View style={styles.orderTableHeader}>
                            <Text style={styles.orderHeaderCell}>Customer</Text>
                            <Text style={styles.orderHeaderCell}>Products</Text>
                            <Text style={styles.orderHeaderCell}>Date</Text>
                            <Text style={styles.orderHeaderCell}>Status</Text>
                        </View>

                        {/* Order Rows */}
                        {orders.slice(0, 5).map((order, index) => (
                            <View key={index} style={styles.orderTableRow}>
                                <Text style={styles.orderTableCell} numberOfLines={1} ellipsizeMode="tail">
                                    {order.customerName}
                                </Text>
                                <View style={styles.orderProductsCell}>
                                    {order.products.map((product, pIndex) => (
                                        <Text key={pIndex} style={styles.productText} numberOfLines={1} ellipsizeMode="tail">
                                            {(product.title)}(x{product.quantity})
                                        </Text>
                                    ))}
                                </View>
                                <Text style={styles.orderTableCell}>
                                    {new Date(order.dateOfOrder).toLocaleDateString()}
                                </Text>
                                {renderStatus(order.orderStatus)}
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
                        {userData?.employees?.map((employee: Employee, index: number) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{employee.name}</Text>
                                <Text style={styles.tableCell} numberOfLines={1} ellipsizeMode="tail">{employee.email}</Text>
                                <Text style={styles.tableCell}>{employee.role}</Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDeleteEmployee(index)}
                                    >
                                        <Text style={styles.actionButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        {/* Add New User Button */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => {
                                if ((userData?.employees?.length || 0) >= 3) {
                                    showAlert('Error', 'Maximum number of employees (3) reached. Please delete an existing employee first.', 'error');
                                } else {
                                    setModalVisible(true);
                                }
                            }}
                        >
                            <Text style={styles.addButtonText}>+ Add New User</Text>
                        </TouchableOpacity>

                        <Modal
                            animationType="slide"
                            transparent
                            visible={modalVisible}
                            onRequestClose={() => {
                                setModalVisible(false);
                                // Reset form when closing
                                setEmployeeName('');
                                setEmployeeEmail('');
                                setEmployeeRole('half_access');
                                setValidationErrors({ name: '', email: '', role: '' });
                            }}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Add Employee</Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setModalVisible(false);
                                                // Reset form when closing
                                                setEmployeeName('');
                                                setEmployeeEmail('');
                                                setEmployeeRole('half_access');
                                                setValidationErrors({ name: '', email: '', role: '' });
                                            }}
                                            style={styles.closeButton}
                                        >
                                            <Icon name="close" size={20} color="#000" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                validationErrors.name ? styles.inputError : null
                                            ]}
                                            placeholder="Employee Name"
                                            value={employeeName}
                                            onChangeText={(text) => {
                                                setEmployeeName(text);
                                                if (validationErrors.name) {
                                                    setValidationErrors(prev => ({ ...prev, name: '' }));
                                                }
                                            }}
                                            placeholderTextColor="#666"
                                        />
                                        {validationErrors.name ? (
                                            <Text style={styles.errorText}>{validationErrors.name}</Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                validationErrors.email ? styles.inputError : null
                                            ]}
                                            placeholder="Employee Email"
                                            value={employeeEmail}
                                            onChangeText={(text) => {
                                                setEmployeeEmail(text);
                                                if (validationErrors.email) {
                                                    setValidationErrors(prev => ({ ...prev, email: '' }));
                                                }
                                            }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            placeholderTextColor="#666"
                                        />
                                        {validationErrors.email ? (
                                            <Text style={styles.errorText}>{validationErrors.email}</Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <TouchableOpacity
                                            style={[
                                                styles.roleButton,
                                                validationErrors.role ? styles.inputError : null
                                            ]}
                                            onPress={() => setAccessModalVisible(true)}
                                        >
                                            <Text style={styles.roleButtonText}>
                                                {employeeRole === 'full_access' ? 'Full Access' : 'Half Access'}
                                            </Text>
                                        </TouchableOpacity>
                                        {validationErrors.role ? (
                                            <Text style={styles.errorText}>{validationErrors.role}</Text>
                                        ) : null}
                                    </View>

                                    <Modal
                                        animationType="slide"
                                        transparent
                                        visible={accessModalVisible}
                                        onRequestClose={() => setAccessModalVisible(false)}
                                    >
                                        <View style={styles.modalOverlay}>
                                            <View style={styles.modalContainer}>
                                                <View style={styles.modalHeader}>
                                                    <Text style={styles.modalTitle}>Select Access Level</Text>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setAccessModalVisible(false);
                                                            if (validationErrors.role) {
                                                                setValidationErrors(prev => ({ ...prev, role: '' }));
                                                            }
                                                        }}
                                                        style={styles.closeButton}
                                                    >
                                                        <Icon name="close" size={20} color="#000" />
                                                    </TouchableOpacity>
                                                </View>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.roleOption,
                                                        employeeRole === 'full_access' && styles.selectedRole
                                                    ]}
                                                    onPress={() => {
                                                        setEmployeeRole('full_access');
                                                        setAccessModalVisible(false);
                                                        if (validationErrors.role) {
                                                            setValidationErrors(prev => ({ ...prev, role: '' }));
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.roleOptionText}>Full Access</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[
                                                        styles.roleOption,
                                                        employeeRole === 'half_access' && styles.selectedRole
                                                    ]}
                                                    onPress={() => {
                                                        setEmployeeRole('half_access');
                                                        setAccessModalVisible(false);
                                                        if (validationErrors.role) {
                                                            setValidationErrors(prev => ({ ...prev, role: '' }));
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.roleOptionText}>Half Access</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Modal>

                                    <TouchableOpacity
                                        style={styles.confirmButton}
                                        onPress={handleConfirm}
                                    >
                                        <Text style={styles.confirmButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    </View>
                </ScrollView>
            )}

            {/* Add CustomAlertModal at the end of the component */}
            <CustomAlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={hideAlert}
            />
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
        overflow:'hidden',
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        marginLeft:-30,
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    inputContainer: {
        marginBottom: 15,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: '#000', // Add this to ensure text is visible
        backgroundColor: '#fff', // Add this to ensure input background is white
    },
    inputError: {
        borderColor: '#ff3b30',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 15,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 15,
    },
    picker: {
        height: 50,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dateButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        flex: 0.48,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    dateButtonText: {
        color: '#333',
        fontSize: 14,
    },
    chartScrollContainer: {
        paddingRight: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 10,
    },
    roleButton: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    roleButtonText: {
        color: '#000', // Add this to ensure text is visible
        fontSize: 16,
        textAlign: 'center',
    },
    roleOption: {
        backgroundColor: '#f0f0f0',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedRole: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196F3',
    },
    roleOptionText: {
        color: '#333',
        fontSize: 16,
        textAlign: 'center',
    },
    datePickerWrapper: {
        alignItems: 'center',
        marginTop: 10,
    },
    datePicker: {
        height: 200,
        width: '100%',
    },
    dotLabel: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 132, 61, 0.9)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    dotLabelText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    orderTableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: '#ddd',
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
        marginBottom: 5,
    },
    orderHeaderCell: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 13,
        color: '#333',
        paddingHorizontal: 10,
    },
    orderTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    orderTableCell: {
        flex: 1,
        fontSize: 12,
        color: '#333',
        paddingHorizontal: 4,
    },
    orderProductsCell: {
        flex: 2,
        paddingHorizontal: 4,
    },
    productText: {
        fontSize: 12,
        color: '#333',
        marginBottom: 4,
    },
});

export default Dashboard;
