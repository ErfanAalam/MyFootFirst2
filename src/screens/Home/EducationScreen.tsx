import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

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
  duration: string;
  image: string;
  videoUrl: string;
}

const blogData: BlogItem[] = [
  {
    id: '1',
    title: "How to Trim Your Orthotics",
    image: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?q=80&w=2071&auto=format&fit=crop",
    description: "Orthotics are designed to support your feet, but sometimes they need a little trimming to fit perfectly inside your shoes. The good news? It's easy to do at home with a few simple steps! Start by removing the insole from your shoe—this will act as a template.Place it over your orthotic, aligning the heels, and trace the outline with a pen or marker.This gives you a guide to follow when trimming.Use sharp scissors and cut slowly along the line.It's better to start conservatively—cut less at first, test the fit, and trim more if needed.Always try the orthotic in your shoe after each adjustment. The goal is for the orthotic to lie flat and snug without bunching or curling.If it still doesn't feel right, make small adjustments until it fits comfortably. A properly trimmed orthotic ensures maximum support and comfort, helping reduce foot fatigue and pain.If you're unsure or nervous about trimming it yourself, consider asking a podiatrist or shoe specialist for help.Remember: your orthotic should work with your shoe, not against it.A good fit means better foot health and daily comfort!."
  },
  {
    id: '2',
    title: " Menopause and Foot Conditions ",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070&auto=format&fit=crop",
    description: "Menopause is a natural phase of life, but it can bring unexpected changes—including in your feet. As estrogen levels drop, the body experiences shifts in bone density, ligament elasticity, and fat distribution, all of which can impact how your feet feel and function. Many women notice foot pain, increased swelling, or a change in foot shape during and after menopause. Arches may flatten, and fat pads that once cushioned your feet may thin out, leading to soreness—especially in the heel and ball of the foot. You may also be more prone to conditions like plantar fasciitis or bunions during this time. Thankfully, there are ways to support your foot health. Wearing supportive, well-cushioned shoes is key. Orthotics or insoles can also help redistribute pressure and relieve pain. Stretching and low-impact exercises like swimming or walking can keep your feet strong and flexible. If foot discomfort becomes a regular issue, it's a good idea to consult a podiatrist. They can assess your foot structure and recommend solutions tailored to your needs. Menopause affects everyone differently, but you don't have to suffer through foot pain—small changes can make a big difference!"
  },
];

// Define video data with YouTube URLs for embedding
const videoData: VideoItem[] = [
  {
    id: '1',
    title: "Sleep Preparation",
    subtitle: "Guided Sleep Meditation",
    duration: "15 min",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop",
    videoUrl: "rRFu0IKNMks?si=FqTDYg6A4oQKPNhS"
  },
  {
    id: '2',
    title: "Morning Energy",
    subtitle: "Start Your Day Right",
    duration: "7 min",
    image: "https://miro.medium.com/v2/resize:fit:1400/0*92EtfQXxrWp8Pk_a",
    videoUrl: "Y2VF8tmLFHw"
  },
];

// Helper function to get YouTube embed HTML
const getYouTubeEmbedHTML = (videoId: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
          .video-container { position: relative; padding-top: 56.25%; /* 16:9 Aspect Ratio */ }
          iframe { position: absolute; top: 0; left: 0; bottom: 0; right: 0; width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div class="video-container">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&controls=1" 
            frameborder="0" 
            allowfullscreen>
          </iframe>
        </div>
      </body>
    </html>
  `;
};

const EducationScreen = () => {
  const [activeTab, setActiveTab] = useState('blog');
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const navigation = useNavigation();

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
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>▶</Text>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderBlogDetail = () => {
    if (!selectedBlog) return null;

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
    if (!playingVideo) return null;

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
              source={{ html: getYouTubeEmbedHTML(playingVideo.videoUrl) }}
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
            <Text style={styles.detailDuration}>{playingVideo.duration}</Text>
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
          <Text style={styles.headerText}>Education</Text>
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
