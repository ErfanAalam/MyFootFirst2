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

interface InsoleImages {
  preview: string;
  thumbnails: string[];
}

// Add image data for each insole type
const insoleImages: Record<InsoleType, InsoleImages> = {
  Sport: {
    preview: 'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FSport%201.jpg?alt=media&token=5174e292-e874-4da8-8572-d583d66deda4',
    thumbnails: [
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FSport%201.jpg?alt=media&token=5174e292-e874-4da8-8572-d583d66deda4',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FSport%202.jpg?alt=media&token=f3806d3c-b1f5-41f1-843a-36fc28b5f851',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FSport%204.jpg?alt=media&token=73bcf85b-f7c5-4f61-a0dd-65b704d34bb0',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FSport%205.jpg?alt=media&token=92f4e0ef-756e-42d9-b714-a3fe17ae3a21',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%201.jpg?alt=media&token=e7696206-72d7-403b-85db-44e5d2ad72ce',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%202.jpg?alt=media&token=e980f2c7-cccb-4806-8c63-105fda345f70',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%204.jpg?alt=media&token=c9d4072d-bbf8-4b25-b110-81d95395cdd7',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%205.jpg?alt=media&token=cc48e61e-a2ea-47fb-a83c-6f5dec8511ee',
    ],
  },
  Active: {
    preview: 'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FActive%201.jpg?alt=media&token=5fe6c496-2f53-4436-9409-056d195bc950',
    thumbnails: [
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FActive%201.jpg?alt=media&token=5fe6c496-2f53-4436-9409-056d195bc950',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FActive%202.jpg?alt=media&token=860822dc-1109-4f02-b743-4d2968b4aca8',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FActive%203.jpg?alt=media&token=f98cd82c-5438-43ed-8268-a171bc602ee2',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FActive%205.jpg?alt=media&token=6269ed30-8248-4929-b70a-0465e0cf8082',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%201.jpg?alt=media&token=e7696206-72d7-403b-85db-44e5d2ad72ce',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%202.jpg?alt=media&token=e980f2c7-cccb-4806-8c63-105fda345f70',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%204.jpg?alt=media&token=c9d4072d-bbf8-4b25-b110-81d95395cdd7',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%205.jpg?alt=media&token=cc48e61e-a2ea-47fb-a83c-6f5dec8511ee',
    ],
  },
  Comfort: {
    preview: 'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FComfort%201.jpg?alt=media&token=d95a7d7e-070d-4ee8-8677-796950496d22',
    thumbnails: [
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FComfort%201.jpg?alt=media&token=d95a7d7e-070d-4ee8-8677-796950496d22',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FComfort%202.jpg?alt=media&token=f70cc6e2-d243-4202-9cbe-22442b3887b1',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FComfort%203.jpg?alt=media&token=d9da7abf-6c91-411e-a19d-a3ea29445279',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FComfort%205.jpg?alt=media&token=595251e1-20ab-4571-8db2-4ba3ae87ff75',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%201.jpg?alt=media&token=e7696206-72d7-403b-85db-44e5d2ad72ce',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%202.jpg?alt=media&token=e980f2c7-cccb-4806-8c63-105fda345f70',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%204.jpg?alt=media&token=c9d4072d-bbf8-4b25-b110-81d95395cdd7',
      'https://firebasestorage.googleapis.com/v0/b/my-foot-first.firebasestorage.app/o/InsoleImages%2FDress%205.jpg?alt=media&token=cc48e61e-a2ea-47fb-a83c-6f5dec8511ee',
    ],
  },
};


const insoleData = {
  Sport: {
    id: 'insole-sport',
    name: 'SPORT Insole',
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
  const [selectedImages, setSelectedImages] = useState<Record<InsoleType, string>>({
    Sport: insoleImages.Sport.preview,
    Active: insoleImages.Active.preview,
    Comfort: insoleImages.Comfort.preview,
  });

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

  const getCurrencyCode = async (countryName: string): Promise<string> => {
    try {
      const res = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0 && data[0].currencies) {
        return Object.keys(data[0].currencies)[0];
      }

      throw new Error('Currency data not found');
    } catch (err) {
      console.error('Failed to fetch currency code:', err);
      return 'EUR';
    }
  };
  // ${toCurrency}

  const getExchangeRate = async (fromCurrency: string): Promise<number> => {
    try {
      // Convert from target currency to EUR
      const res = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=EUR`);
      const data = await res.json();

      if (!data || !data.rates || !data.rates.EUR) {
        throw new Error('Invalid exchange rate response');
      }

      // Return the rate to convert from target currency to EUR
      return data.rates.EUR;
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
      return 1; // fallback to 1:1 rate if API fails
    }
  };

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

  // Add function to handle image selection
  const handleImageSelect = (insoleType: InsoleType, imageUrl: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [insoleType]: imageUrl
    }));
  };

  // Function to handle adding insole to cart with dress insole data
  const handleAddToCart = async (insoleType: InsoleType) => {
    if (!pricing) return;

    if (isDressInsole && (!shoeType || shoeType.trim().split(' ').length > 5)) {
      setShowShoeTypeError(true);
      return;
    }

    const insole = insoleData[insoleType];
    const price = pricing[insoleType] + pricing.Shipping;

    let currencyCode = 'EUR'; // Default to EUR
    const allowedCurrencies = ['USD', 'EUR', 'INR', 'GBP'];


    if (customer?.country) {
      const fetchedCurrencyCode = await getCurrencyCode(customer.country);
      if (allowedCurrencies.includes(fetchedCurrencyCode)) {
        currencyCode = fetchedCurrencyCode;
      }
    }

    const exchangeRate = await getExchangeRate(currencyCode);

    // Convert price to EUR
    const priceInEuro = price * exchangeRate;

    // Format the insole data as expected by the cart context
    const product = {
      id: `insole-${insoleType.toLowerCase()}`,
      title: insole.name,
      price: price,
      newPrice: pricing.currency + price,
      selectedImage: selectedImages[insoleType],
      description: insole.features.join(' | '),
      selectedSize: shoeSize.country + ' ' + shoeSize.size,
      selectedColor: 'NoOptions',
      quantity: 1,
      priceValue: priceInEuro,
    };

    // Add to cart

    // console.log(product)

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
                shoesType: shoeType.trim(),
              },
            };
          }
          return cust;
        });

        await retailerRef.update({
          customers: updatedCustomers,
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
                {/* Main Image Preview */}
                <Image
                  source={{ uri: selectedImages[type] }}
                  style={styles.insoleImage}
                  resizeMode="stretch"
                />

                {/* Thumbnail Gallery */}
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  style={styles.thumbnailContainer}
                >
                  <View style={styles.thumbnailGrid}>
                    {insoleImages[type].thumbnails.map((thumbnail, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleImageSelect(type, thumbnail)}
                        style={[
                          styles.thumbnailWrapper,
                          selectedImages[type] === thumbnail && styles.selectedThumbnail
                        ]}
                      >
                        <Image
                          source={{ uri: thumbnail }}
                          style={styles.thumbnail}
                          resizeMode="stretch"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>


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
  thumbnailContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
    width: '100%',
  },
  thumbnailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  thumbnailWrapper: {
    width: '24%', // Leave a little space for margin
    aspectRatio: 1,
    margin: '0.5%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: '#4CAF50',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
});

export default InsoleRecommendation;
