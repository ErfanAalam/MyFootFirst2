import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const VolumentalScreen = () => {
    return (
        <View style={styles.container}>
          <WebView
            source={{ uri: 'https://cdn.widget.volumental.com/collector/index.html' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            originWhitelist={['*']}
          />
        </View>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
    });

export default VolumentalScreen;