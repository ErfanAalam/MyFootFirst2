import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar as RNStatusBar,
} from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FootDiagram from "../../Components/FootDiagram";
import { getAuth } from '@react-native-firebase/auth';
import { useUser } from "../../contexts/UserContext";
import CustomAlertModal from "../../Components/CustomAlertModal";
import CustomerDetailsModal from "../../Components/CustomerDetailsModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firestore from '@react-native-firebase/firestore';

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  phoneNumber: string;
};

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  FootScanScreen: { customer: Customer; retailerId: string };
  InsoleQuestions: undefined;
  OrthoticSale: { customer: Customer; retailerId: string };
  Volumental: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userData } = useUser();
  const [selectedFoot, setSelectedFoot] = useState<"left" | "right">("left");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [retailerId, setRetailerId] = useState("")
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    const findRetailerId = async () => {
      const isEmployeeLoggedIn = await AsyncStorage.getItem('isEmployeeLoggedIn');

      if (isEmployeeLoggedIn) {
        const storedRetailerId = await AsyncStorage.getItem('RetailerId');
        if (storedRetailerId) {
          setRetailerId(storedRetailerId);
        }
      } else if (userData?.RetailerId) {
        setRetailerId(userData.RetailerId.toString());
      }
    };

    findRetailerId();
  }, [userData])

  const handlePainPointSelection = (pointId: string) => {
    if (pointId === "no-pain") {
      // If selecting "No Pain", clear all other selections
      setPainPoints(["no-pain"]);
    } else {
      // If selecting a pain point
      setPainPoints((prev) => {
        // Remove "no-pain" if it exists
        const filtered = prev.filter(id => id !== "no-pain");
        // Toggle the selected point
        return filtered.includes(pointId)
          ? filtered.filter(id => id !== pointId)
          : [...filtered, pointId];
      });
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const handleScanFoot = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        showAlert('Error', 'User not logged in', 'error');
        return;
      }

      setCustomerModalVisible(true);
    } catch (error) {
      showAlert('Error', 'Failed to proceed with scan', 'error');
    }
  };

  const checkRetailerSubscription = async (retailerId: string) => {
    try {
      const retailerDoc = await firestore()
        .collection('Retailers')
        .doc(retailerId)
        .get();

      const retailerData = retailerDoc.data();
      return retailerData?.subscription?.paid === true;
    } catch (error) {
      console.error('Error checking retailer subscription:', error);
      return false;
    }
  };

  const handleCustomerSelect = async (customer: Customer) => {
    setCustomerModalVisible(false);

    if (!retailerId) {
      showAlert('Error', 'Retailer ID not found', 'error');
      return;
    }
    console.log(customer)
    await AsyncStorage.setItem('customer', JSON.stringify(customer));

    try {
      // Get the current retailer document
      const retailerRef = firestore().collection('Retailers').doc(retailerId);
      const retailerDoc = await retailerRef.get();
      const retailerData = retailerDoc.data();

      if (!retailerData || !retailerData.customers) {
        showAlert('Error', 'Retailer data not found', 'error');
        return;
      }

      // Find and update the specific customer in the customers array
      const updatedCustomers = retailerData.customers.map((c: any) => {
        if (c.id === customer.id) {
          return {
            ...c,
            painPoints: painPoints,
            updatedAt: Date.now(),
          };
        }
        return c;
      });

      // Update the retailer document with the modified customers array
      await retailerRef.update({
        customers: updatedCustomers,
      });

      const hasSubscription = await checkRetailerSubscription(retailerId);

      if (hasSubscription) {
        navigation.navigate("FootScanScreen", { customer, retailerId: retailerId });
      } else {
        navigation.navigate("OrthoticSale", { customer, retailerId: retailerId });
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
      showAlert('Error', 'Failed to update customer data', 'error');
    }
  };

  const handleNewCustomerSubmit = async (customer: Customer) => {
    if (!retailerId) {
      showAlert('Error', 'Retailer ID not found', 'error');
      return;
    }

    await AsyncStorage.setItem('customer', JSON.stringify(customer));

    try {
      // Get the current retailer document
      const retailerRef = firestore().collection('Retailers').doc(retailerId);
      const retailerDoc = await retailerRef.get();
      const retailerData = retailerDoc.data();

      if (!retailerData) {
        showAlert('Error', 'Retailer data not found', 'error');
        return;
      }

      // Create new customer object with pain points
      const newCustomer = {
        ...customer,
        painPoints: painPoints,
        updatedAt: Date.now()
      };

      // Add the new customer to the customers array
      const updatedCustomers = [...(retailerData.customers || []), newCustomer];

      // Update the retailer document with the modified customers array
      await retailerRef.update({
        customers: updatedCustomers,
      });

      const hasSubscription = await checkRetailerSubscription(retailerId);

      if (hasSubscription) {
        navigation.navigate("FootScanScreen", { customer, retailerId: retailerId });
      } else {
        navigation.navigate("OrthoticSale", { customer, retailerId: retailerId });
      }
    } catch (error) {
      console.error('Error adding new customer:', error);
      showAlert('Error', 'Failed to add new customer', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
      <CustomerDetailsModal
        visible={customerModalVisible}
        onClose={() => setCustomerModalVisible(false)}
        onCustomerSelect={handleCustomerSelect}
        onNewCustomerSubmit={handleNewCustomerSubmit}
      />
      <RNStatusBar backgroundColor="#000000" translucent={true} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.username}>Hi, {userData?.contactFirstName || 'User'}</Text>
        </View>

        <View style={styles.fitCheckContainer}>
          <Text style={styles.fitCheckTitle}>Start Your Personal Fit Check </Text>
          <Text style={styles.fitCheckDescription}>Takes just a few minutes — we guide you step by step. The more info you give, the better we match your insoles. You can skip
            some steps if you prefer.</Text>


          <View style={styles.painSection}>
            <Text style={styles.sectionTitle}>
              Tell us where it hurts — or skip if your feet feel fine
            </Text>

            <View style={styles.footSelector}>
              {["left", "right"].map((foot) => (
                <TouchableOpacity
                  key={foot}
                  style={[
                    styles.footButton,
                    selectedFoot === foot && styles.footButtonSelected,
                  ]}
                  onPress={() => setSelectedFoot(foot as "left" | "right")}
                >
                  <Text
                    style={[
                      styles.radioLabel,
                      selectedFoot === foot && { color: "#fff" },
                    ]}
                  >
                    {foot === "left" ? "Left Foot" : "Right Foot"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footDiagramContainer}>
              <FootDiagram
                foot={selectedFoot}
                selectedPoints={painPoints}
                onSelectPoint={handlePainPointSelection}
              />
            </View>

            <Button
              mode="contained"
              style={styles.nextButton}
              onPress={handleScanFoot}
            >
              <Text style={styles.buttonText}>Scan Your Foot</Text>
            </Button>
          </View>
        </View>
      </ScrollView>

      <View style={styles.stepIndicatorContainer}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <View
            key={step}
            style={[
              styles.stepbar,
              step === 1 ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  username: {
    fontFamily: "OpenSans-Light",
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  fitCheckContainer: {
    margin: 15,
    elevation: 3,
  },
  fitCheckTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  fitCheckDescription: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  fitCheckSubDescription: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },
  painSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#444",
  },
  footSelector: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
  },
  footButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginRight: 16,
  },
  footButtonSelected: {
    backgroundColor: "#00843D", // same as radio button color
    borderColor: "#00843D",
  },
  radioLabel: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  footDiagramContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: "#00843D",
    paddingVertical: 8,
    borderRadius: 8,
  },
  recommendationsContainer: {
    padding: 15,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  gridItem: {
    width: '48%', // 2 items per row with small spacing
    marginBottom: 16,
  },
  productCard: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: "#fff",
  },
  productImage: {
    height: 120,
    resizeMode: 'cover',
  },
  productContent: {
    padding: 10,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    marginTop: 8,
  },
  productTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  showAllButton: {
    borderColor: "#00843D",
    borderRadius: 8,
  },
  showAllButtonText: {
    color: "#00843D",
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  stepbar: {
    width: 40,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: "#00843D",
  },
  inactiveDot: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: '#fff',
  },
});

export default HomeScreen;
