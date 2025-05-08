import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define types
interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  description: string;
  colors: string[];
  sizes?: string[];
}

type RootStackParamList = {
  ProductDetail: { product: Product };
  MainTabs: undefined;
  Cart: undefined;
};

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Dummy product data
const products: Product[] = [
  {
    id: '1',
    title: 'Leather Sleepers',
    price: 21.40,
    image: 'https://sreeleathersonline.com/cdn/shop/products/1B6A8386-PhotoRoom.png?v=1668503614',
    description: 'A nourishing shampoo formula designed to strengthen your hair from the roots.',
    colors: ['black', 'white', 'brown'],
    sizes: ['6', '7', '8', '9', '10']
  },
  {
    id: '2',
    title: 'Walking Pro Insoles',
    price: 24.99,
    image: 'https://dropinblog.net/34250199/files/walking-pro-insoles-3-43201.jpg',
    description: 'Promotes hair growth and prevents hair fall with natural Images.',
    colors: ['black', 'white', 'brown'],
    sizes: ['6', '7', '8', '9', '10']
  },
  {
    id: '3',
    title: 'Sneakers',
    price: 19.95,
    image: 'https://www.shutterstock.com/image-photo/white-sneaker-sport-shoe-on-260nw-2155395817.jpg',
    description: 'Deep moisturizing conditioner for dry and damaged hair.',
    colors: ['black', 'white', 'brown'],
    sizes: ['7', '8', '9', '10']
  },
  {
    id: '4',
    title: 'Renesmee Orthotic Arch Support',
    price: 18.50,
    image: 'https://images.meesho.com/images/products/361185343/4srll_512.webp',
    description: 'Effectively controls dandruff and soothes the scalp.',
    colors: ['black', 'white', 'brown'],
    sizes: ['8', '9', '10', '11', '12']
  },
  {
    id: '5',
    title: 'Fuel Sneakers',
    price: 26.75,
    image: 'https://fuelshoes.com/cdn/shop/files/8_1e1df76b-b544-44fc-8c2f-e31dba4b1eb3.jpg?v=1720001401&width=3000',
    description: 'Intensive repair treatment for severely damaged hair.',
    colors: ['black', 'white', 'brown'],
    sizes: ['8', '9', '10', '11', '12']
  },
  {
    id: '6',
    title: 'Campus Sneakers',
    price: 22.95,
    image: 'https://www.campusshoes.com/cdn/shop/files/FIRST_11G-787_WHT-SIL-B.ORG.webp?v=1745400096',
    description: 'Protects color-treated hair and prevents fading.',
    colors: ['black', 'white', 'brown'],
    sizes: ['7', '8', '9', '10', '11']
  },
];

interface ProductCardProps {
  item: Product;
  onPress: () => void;
}

const ProductCard = ({ item, onPress }: ProductCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.productTitle}>{item.title}</Text>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

const EcommerceScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyShop</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
            style={styles.cartIcon}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Explore Products</Text>
      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductCard item={item} onPress={() => handleProductPress(item)} />
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  cartButton: {
    padding: 6,
  },
  cartIcon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginVertical: 16,
    paddingHorizontal: 16,
    color: '#333',
  },
  productList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    height: "100%",
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00843D',
  },
});

export default EcommerceScreen;
