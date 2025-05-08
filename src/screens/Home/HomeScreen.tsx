import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StatusBar as RNStatusBar,
} from "react-native";
import { Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import FootDiagram from "../../Components/FootDiagram";
import { useUser } from "../../contexts/UserContext";
// import FootScanScreen from './FootScanScreen'

const { width } = Dimensions.get("window");

type Product = {
  id: string;
  price: string;
  title: string;
  image: any;
};

// Define the navigation types
type RootStackParamList = {
  Home: undefined;
  FootScanScreen: undefined;
  InsoleQuestions: undefined;
  OrthoticSale: undefined;
  Volumental: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userData } = useUser();
  const [selectedFoot, setSelectedFoot] = useState<"left" | "right">("left");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      price: "$49.99",
      title: "Insole 1",
      image: require("../../assets/images/banner1.jpg"),
    },
    {
      id: "2",
      price: "$59.99",
      title: "Insole 2",
      image: require("../../assets/images/banner2.webp"),
    },
    {
      id: "3",
      price: "$39.99",
      title: "Insole 3",
      image: require("../../assets/images/banner3.jpeg"),
    },
    {
      id: "4",
      price: "$39.99",
      title: "Insole 4",
      image: require("../../assets/images/banner3.jpeg"),
    },
  ]);

  const handlePainPointSelection = (pointId: string) => {
    setPainPoints((prev) =>
      prev.includes(pointId)
        ? prev.filter((id) => id !== pointId)
        : [...prev, pointId]
    );
  };

  console.log(userData);
  

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar backgroundColor="#000000" translucent={true} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.username}>Hi, {userData?.contactFirstName ? `${userData.contactFirstName} ${userData.contactLastName}` : `${userData?.name}` ? `${userData?.name}` : "User"}</Text>
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
              // onPress={() => navigation.navigate("OrthoticSale")}
              onPress={() => navigation.navigate("Volumental")}
            >
              <Text style={styles.buttonText}>Scan Your Foot</Text>
            </Button>
          </View>
        </View>

        {/* <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations for You</Text>

          <View style={styles.gridContainer}>
            {products.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <Card style={styles.productCard}>
                  <Card.Cover source={product.image} style={styles.productImage} />
                  <Card.Content style={styles.productContent}>
                    <View style={styles.productTitleRow}>
                      <Text style={styles.productTitle}>{product.title}</Text>
                      <Text style={styles.productPrice}>{product.price}</Text>
                    </View>
                  </Card.Content>
                </Card>
              </View>
            ))}
          </View>

          <Button
            mode="outlined"
            style={styles.showAllButton}
            onPress={() => navigation.navigate("InsoleQuestions")}
          >
            <Text style={styles.showAllButtonText}>Show All</Text>
          </Button>
        </View> */}
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
    fontFamily:"OpenSans-Light",
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
