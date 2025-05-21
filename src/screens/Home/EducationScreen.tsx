import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, SafeAreaView, StatusBar, Platform } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import firestore from '@react-native-firebase/firestore';
// Define types for blog and video items
interface BlogItem {
  id: string;
  title: string;
  image: string;
  description: string;
}

interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  createdAt: any; // Firestore timestamp
}

const EducationScreen = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [blogData, setBlogData] = useState<BlogItem[]>([]);
  const [videoData, setVideoData] = useState<VideoItem[]>([]);

  useEffect(() => {
    // Fetch blogs
    const unsubscribeBlogs = firestore()
      .collection('Blogs')
      .onSnapshot(snapshot => {
        const BlogData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as BlogItem[];
        setBlogData(BlogData);
      });

    // Fetch videos
    const unsubscribeVideos = firestore()
      .collection('videos')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const videos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as VideoItem[];
        setVideoData(videos);
      });

    return () => {
      unsubscribeBlogs();
      unsubscribeVideos();
    };
  }, []);

  const renderBlogItem = (item: BlogItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemContainer}
        onPress={() => setSelectedBlog(item)}
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <Text style={styles.itemTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  const renderVideoItem = (item: VideoItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemContainer}
        onPress={() => setPlayingVideo(item)}
      >
        <View style={styles.videoImageContainer}>
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>▶</Text>
          </View>
        </View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderBlogDetail = () => {
    if (!selectedBlog) {
      return null;
    }

    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedBlog(null)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <ScrollView>
          <Image source={{ uri: selectedBlog.image }} style={styles.detailImage} />
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedBlog.title}</Text>
            <Text style={styles.detailDescription}>{selectedBlog.description}</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderVideoPlayer = () => {
    if (!playingVideo) {
      return null;
    }

    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setPlayingVideo(null);
          }}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.videoDetailContainer}>
          <View style={styles.videoPlayerContainer}>
            <WebView
              source={{ uri: playingVideo.videoUrl }}
              style={styles.videoPlayerContent}
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo={true}
              allowsInlineMediaPlayback={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{playingVideo.title}</Text>
            <Text style={styles.detailSubtitle}>{playingVideo.subtitle}</Text>
            <Text style={styles.detailDescription}>{playingVideo.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (selectedBlog) {
      return renderBlogDetail();
    }

    if (playingVideo) {
      return renderVideoPlayer();
    }

    return (
      <ScrollView style={styles.contentContainer}>
        <View style={styles.gridContainer}>
          {activeTab === 'blog' ?
            blogData.map(item => renderBlogItem(item)) :
            videoData.map(item => renderVideoItem(item))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#00843D" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header Component */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Foot Health Hub</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'blog' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('blog');
              setSelectedBlog(null);
              setPlayingVideo(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'blog' && styles.activeTabText]}>Blog</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'video' && styles.activeTabButton]}
            onPress={() => {
              setActiveTab('video');
              setSelectedBlog(null);
              setPlayingVideo(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Video</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitle}>
          {activeTab === 'blog' ? 'Blog' : 'Video'}
        </Text>

        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00843D',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    backgroundColor: '#00843D',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
  },
  activeTabButton: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  activeTabText: {
    color: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  contentContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  itemContainer: {
    width: itemWidth,
    marginBottom: 20,
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  durationBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  videoImageContainer: {
    position: 'relative',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#333',
    fontSize: 16,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  videoDetailContainer: {
    flex: 1,
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  detailImage: {
    width: '100%',
    height: 300,
  },
  detailContent: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  detailDuration: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  detailDescription: {
    fontSize: 16,
    textAlign: 'justify',
    lineHeight: 24,
    marginTop: 15,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  videoPlayerContent: {
    width: '100%',
    height: '100%',
  },
});

export default EducationScreen;
