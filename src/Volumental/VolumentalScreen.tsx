import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const VolumentalScreen = () => {
    const injectedHtml = `
    <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Volumental</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.6.0/webcomponents-bundle.js"></script>
       <style>
       html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: #000;
        display: flex;
        justify-content: center;
        align-items: center;
        }
        </style>
        </head>
        <body>
        
        <script 
          async 
          src="https://js.volumental.com/sdk/v1/volumental.js" 
          data-client-id="m2IiZHYiVDap31YxnSFbEMoB7MHoCTdW">
        </script>
      <volumental-recommendation
        product-id="21010115601-001"
        size-locale="EU"
        component-type="sizechart-button"
        variant="link"
        theme="light"
      ></volumental-recommendation>
    </body>
  </html>
  `;

    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html: injectedHtml }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
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