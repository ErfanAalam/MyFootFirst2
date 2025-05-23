import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useWindowDimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Checkbox, Portal, Dialog } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../../contexts/CartContext';
import firestore from '@react-native-firebase/firestore';

type InsoleType = 'Sport' | 'Active' | 'Comfort';

type RootStackParamList = {
  InsoleQuestions: undefined;
  InsoleRecommendation: { recommendedInsole: InsoleType, shoeSize: { country: string, size: number }, RetailerId: string, customer: any };
  Cart: undefined;
};

type InsoleRecommendationRouteProp = RouteProp<RootStackParamList, 'InsoleRecommendation'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InsoleRecommendation'>;

interface InsolePricing {
  Sport: number;
  Active: number;
  Comfort: number;
  Shipping: number;
  currency: string;
}

const insoleData = {
  Sport: {
    id: 'insole-sport',
    name: 'SPORT Insole',
    image: require('../../assets/images/banner1.png'),
    features: [
      'Lightweight and flexible for active movement',
      'Ideal for athletic use',
      'Reduces foot fatigue during high-impact activities',
      'Supports fast-paced walking, running, and workouts',
      'Breathable design keeps feet cool and dry',
    ],
  },
  Active: {
    id: 'insole-active',
    name: 'ACTIVE Insole',
    image: require('../../assets/images/banner2.jpg'),
    features: [
      'All-day cushioning for casual and work shoes',
      'Great for moderate activity',
      'Reduces pressure on forefoot and heel',
      'Soft foam base for maximum shock absorption',
      'Ideal for standing or walking for long hours',
    ],
  },
  Comfort: {
    id: 'insole-comfort',
    name: 'COMFORT Insole',
    image: require('../../assets/images/banner3.jpeg'),
    features: [
      'Firm support for feet',
      'Designed to ease chronic heel, knee, or back pain',
      'Extra arch support to improve alignment',
      'Rigid heel cup for motion control',
      'Recommended for low activity or long standing periods',
    ],
  },
};

const InsoleRecommendation = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InsoleRecommendationRouteProp>();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const { addToCart } = useCart();
  const [pricing, setPricing] = useState<InsolePricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDressInsole, setIsDressInsole] = useState(false);
  const [shoeType, setShoeType] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showShoeTypeError, setShowShoeTypeError] = useState(false);

  // Get the recommended insole type from navigation params
  const recommendedInsole = route.params.recommendedInsole;
  const shoeSize = route.params.shoeSize;
  const RetailerId = route.params.RetailerId;
  const customer = route.params.customer;

  // Determine the card order with recommended in center
  const insoleTypes: InsoleType[] = ['Sport', 'Active', 'Comfort'];

  // Reorder types to ensure recommended is in the middle
  const orderedTypes = [...insoleTypes];
  if (recommendedInsole !== insoleTypes[1]) {
    const recIndex = insoleTypes.indexOf(recommendedInsole);
    // Swap the recommended insole with the middle one
    [orderedTypes[1], orderedTypes[recIndex]] = [orderedTypes[recIndex], orderedTypes[1]];
  }

  // Card dimensions
  const CARD_WIDTH = width * 0.8;
  const SPACING = width * 0.03;

  // Fetch retailer country and pricing from Firestore
  useEffect(() => {
    const fetchRetailerAndPricing = async () => {
      try {
        // First fetch retailer country
        const retailerDoc = await firestore()
          .collection('Retailers')
          .doc(RetailerId)
          .get();

        if (!retailerDoc.exists) {
          throw new Error('Retailer not found');
        }

        const retailerData = retailerDoc.data();
        const country = retailerData?.country || 'Ireland'; // Fallback to Ireland if no country

        // Then fetch pricing for the retailer's country
        const countryDoc = await firestore()
          .collection('InsolePricing')
          .doc(country)
          .get();

        if (countryDoc.exists) {
          setPricing(countryDoc.data() as InsolePricing);
        } else {
          // If country not found, use Ireland's pricing as fallback
          const irelandDoc = await firestore()
            .collection('InsolePricing')
            .doc('Ireland')
            .get();

          if (irelandDoc.exists) {
            setPricing(irelandDoc.data() as InsolePricing);
          }
        }
      } catch (error) {
        console.error('Error fetching retailer or pricing:', error);
        // Fallback to Ireland pricing on error
        const irelandDoc = await firestore()
          .collection('InsolePricing')
          .doc('Ireland')
          .get();

        if (irelandDoc.exists) {
          setPricing(irelandDoc.data() as InsolePricing);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRetailerAndPricing();
  }, [RetailerId]); // Only depend on RetailerId now

  useEffect(() => {
    // Scroll to the middle card (recommended) on initial render
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: (CARD_WIDTH + SPACING) * 1,
        animated: false,
      });
    }, 100);
  }, [CARD_WIDTH, SPACING]);

  // Function to handle adding insole to cart with dress insole data
  const handleAddToCart = async (insoleType: InsoleType) => {
    if (!pricing) return;

    if (isDressInsole && (!shoeType || shoeType.trim().split(' ').length > 5)) {
      setShowShoeTypeError(true);
      return;
    }

    const insole = insoleData[insoleType];
    const price = pricing[insoleType] + pricing.Shipping;

    // Format the insole data as expected by the cart context
    const product = {
      id: `insole-${insoleType.toLowerCase()}`,
      title: insole.name,
      price: price,
      newPrice: pricing.currency + price,
      selectedImage: Image.resolveAssetSource(insole.image).uri,
      description: insole.features.join(' | '),
      selectedSize: shoeSize.country + ' ' + shoeSize.size,
      selectedColor: 'NoOptions',
      quantity: 1,
      priceValue: price,
    };

    // Add to cart

    addToCart(product);

    // If dress insole is selected, update the customer data in Firestore
    if (isDressInsole && shoeType) {
      try {
        const retailerRef = firestore().collection('Retailers').doc(RetailerId);
        const retailerDoc = await retailerRef.get();
        const customers = retailerDoc.data()?.customers || [];

        // Find and update the specific customer's shoesType
        const updatedCustomers = customers.map((cust: any) => {
          if (cust.id === customer.id) {
            return {
              ...cust,
              shoeType: {
                type: 'Yes',
                shoesType: shoeType.trim()
              }
            };
          }
          return cust;
        });

        await retailerRef.update({
          customers: updatedCustomers
        });
      } catch (error) {
        console.error('Error updating customer shoes type:', error);
      }
    }

    navigation.navigate('Cart');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Loading pricing information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pricing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text>Unable to load pricing information. Please try again later.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navigationHeader}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="#333"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.navigationTitle}>Insole Recommendation</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Based on your responses, we recommend...</Text>
        </View>

        {/* Horizontal Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContainer}
          style={styles.carousel}
        >
          {orderedTypes.map((type) => {
            const isRecommended = type === recommendedInsole;
            const insole = insoleData[type];
            const price = pricing[type] + pricing.Shipping;

            return (
              <View
                key={type}
                style={[
                  styles.card,
                  { width: CARD_WIDTH, marginHorizontal: SPACING / 2 },
                  isRecommended && styles.recommendedCard,
                ]}
              >
                {isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Why this is recommended for you</Text>
                  </View>
                )}
                <Text style={[styles.cardTitle, isRecommended && styles.recommendedTitle]}>{insole.name}</Text>
                <Image source={insole.image} style={styles.insoleImage} resizeMode="cover" />
                <Text style={styles.priceText}>{pricing.currency}{price}</Text>
                <View style={styles.featuresContainer}>
                  {insole.features.map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.dressInsoleSection}>
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      status={isDressInsole ? 'checked' : 'unchecked'}
                      onPress={() => setIsDressInsole(!isDressInsole)}
                    />
                    <Text style={styles.checkboxLabel}>Do you want a dress insole?</Text>
                    <IconButton
                      icon="information"
                      size={20}
                      onPress={() => setShowInfoModal(true)}
                      style={styles.infoButton}
                    />
                  </View>

                  {isDressInsole && (
                    <View style={styles.shoeTypeContainer}>
                      <View style={{ padding: 4, marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, paddingLeft: 12, fontWeight: 'bold' }}>What shoes do you wear? (mandatory limit 5 words)</Text>
                        {/* <Text style={{ fontSize: 14, paddingLeft: 12, }}></Text> */}
                      </View>
                      <TextInput
                        style={[styles.shoeTypeInput, showShoeTypeError && styles.errorInput]}
                        placeholder="I wear bata shoes"
                        value={shoeType}
                        placeholderTextColor="grey"
                        onChangeText={(text) => {
                          setShoeType(text);
                          setShowShoeTypeError(false);
                        }}
                        maxLength={50}
                      />
                      {showShoeTypeError && (
                        <Text style={styles.errorText}>
                          Please enter shoe type (max 5 words)
                        </Text>
                      )}
                    </View>
                  )}
                </View>



                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleAddToCart(type)}
                >
                  <Text style={styles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>


        <View style={styles.guaranteeSection}>
          <View style={styles.guaranteeItem}>
            <IconButton icon="shield-check" size={24} iconColor="#4CAF50" />
            <Text style={styles.guaranteeText}>30 Days Comfort Guarantee</Text>
          </View>
          <View style={styles.guaranteeItem}>
            <IconButton icon="keyboard-return" size={24} iconColor="#4CAF50" />
            <Text style={styles.guaranteeText}>Free Returns</Text>
          </View>
        </View>
      </ScrollView>

      <Portal>
        <Dialog style={{ backgroundColor: "#00843D" }} visible={showInfoModal} onDismiss={() => setShowInfoModal(false)}>
          <Dialog.Title>Dress Insole Information</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: "white" }}>A thin, supportive insole designed for formal or dress shoes.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <TouchableOpacity onPress={() => setShowInfoModal(false)}>
              <Text style={styles.dialogButton}>Close</Text>
            </TouchableOpacity>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    margin: 0,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  rightPlaceholder: {
    width: 40,
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  headerSection: {
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  carousel: {
    marginBottom: 30,
  },
  carouselContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
    height: 'auto',
  },
  recommendedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  recommendedTitle: {
    color: '#4CAF50',
    fontSize: 20,
  },
  insoleImage: {
    height: 150,
    width: '100%',
    marginBottom: 15,
    borderRadius: 8,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginTop: 6,
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: '#00843D',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  recommendedButtonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    zIndex: 1,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  guaranteeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00843D',
    textAlign: 'center',
    marginBottom: 15,
  },
  dressInsoleSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  infoButton: {
    margin: 0,
  },
  shoeTypeContainer: {
    marginTop: 10,
  },
  shoeTypeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
  },
  dialogButton: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
    padding: 8,
  },
});

export default InsoleRecommendation;
