import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { Svg, Circle, Rect } from "react-native-svg";

interface FootDiagramProps {
  foot: "left" | "right";
  selectedPoints: string[];
  onSelectPoint: (point: string) => void;
}

// (Your LeftPainPoints and RightPainPoints here)
// Create left and right foot pain points with unique IDs
const LeftPainPoints = [
  { id: "left-Hammer-toe", label: "Hammer-Toe", x: 153, y: 45, w: 15, h: 20, rx: 5, ry: 10 },
  { id: "left-Ball of Foot Pain", label: "Ball of Foot Pain", x: 155, y: 75, w: 20, h: 20, rx: 15, ry: 15 },
  { id: "left-Bunion Big Toe", label: "Bunion Big Toe", x: 185, y: 90, w: 25, h: 35, rx: 15, ry: 25 },
  { id: "left-Bunionette Little Toe", label: "Bunionette Little Toe", x: 115, y: 115, w: 25, h: 35, rx: 15, ry: 25 },
  { id: "left-Metatarsalgia", label: "Metatarsalgia", x: 150, y: 100, w: 55, h: 25, rx: 25, ry: 35 },
  { id: "left-Morton's Neuroma", label: "Morton's Neuroma", x: 145, y: 150, w: 35, h: 25, rx: 25, ry: 35 },
  { id: "left-High Arches / Arch Pain", label: "High Arches/Arch Pain ", x: 175, y: 200, w: 25, h: 45, rx: 25, ry: 35 },
  { id: "left-Plantar Fasciitis", label: "Plantar Fasciitis", x: 155, y: 235, w: 55, h: 25, rx: 25, ry: 35 },
  { id: "left-Heel Pain/Achilles Pain", label: "Heel Pain/Achilles Pain", x: 155, y: 265, w: 35, h: 20, rx: 25, ry: 35 },
];



const RightPainPoints = [
  { id: "right-Hammer-toe", label: "Hammer-Toe", x: 147, y: 45, w: 15, h: 20, rx: 5, ry: 10 },
  { id: "right-Ball of Foot Pain", label: "Ball of Foot Pain", x: 149, y: 75, w: 20, h: 20, rx: 15, ry: 15 },
  { id: "right-Bunion Big Toe", label: "Bunion Big Toe", x: 182, y: 90, w: 25, h: 35, rx: 15, ry: 25 },
  { id: "right-Bunionette Little Toe", label: "Bunionette Little Toe", x: 112, y: 115, w: 25, h: 35, rx: 15, ry: 25 },
  { id: "right-Metatarsalgia", label: "Metatarsalgia", x: 145, y: 100, w: 55, h: 25, rx: 25, ry: 35 },
  { id: "right-Morton's Neuroma", label: "Morton's Neuroma", x: 135, y: 150, w: 35, h: 25, rx: 25, ry: 35 },
  { id: "right-High Arches / Arch Pain", label: "High Arches/Arch Pain ", x: 180, y: 200, w: 25, h: 45, rx: 25, ry: 35 },
  { id: "right-Plantar Fasciitis", label: "Plantar Fasciitis", x: 160, y: 235, w: 55, h: 25, rx: 25, ry: 35 },
  { id: "right-Heel Pain/Achilles Pain", label: "Heel Pain/Achilles Pain", x: 160, y: 265, w: 35, h: 20, rx: 25, ry: 35 },
];


const FootDiagram: React.FC<FootDiagramProps> = ({
  foot,
  selectedPoints,
  onSelectPoint,
}) => {
  const points = foot === "left" ? LeftPainPoints : RightPainPoints;

  const getAdjustedX = (x: number) => (foot === "right" ? 300 - x : x);

  return (
    <View style={styles.container}>
      <Image
        source={
          foot === "left"
            ? require("../assets/images/leftFoot.png") // ✅ fixed path
            : require("../assets/images/rightFoot.png")
        }
        style={styles.footImage}
        resizeMode="contain"
      />

      <Svg height="300" width="300" style={styles.svgOverlay}>
        {points.map((point) => (
          <Rect
            key={point.id}
            x={getAdjustedX(point.x) - point.w / 2}
            y={point.y - point.h / 2}
            width={point.w}
            height={point.h}
            rx={point.rx}
            ry={point.ry}
            fill={
              selectedPoints.includes(point.id)
                ? "#00843D"
                : "rgba(58, 56, 56, 0.5)"
            }
            onPress={() => onSelectPoint(point.id)}
          />
        ))}
      </Svg>

      <View style={styles.legendContainer}>
        {points.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={styles.legendItem}
            onPress={() => onSelectPoint(point.id)}
          >
            <View
              style={[
                styles.legendDot,
                selectedPoints.includes(point.id) && styles.selectedDot,
              ]}
            />
            <Text style={styles.legendText}>{point.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // alignItems: "center",
    position: "relative",
  },
  footImage: {
    width: 300,
    height: 300,
  },
  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  legendContainer: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  legendItem: {
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: "2.5%",
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(102, 99, 99, 0.5)",
    marginRight: 8,
  },
  selectedDot: {
    backgroundColor: "#00843D",
  },
  legendText: {
    fontSize: 14,
    color: "#333",
  },
});

export default FootDiagram;
