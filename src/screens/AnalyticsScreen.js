import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function AnalyticsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const base = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${base}/api/analytics/summary`);
        const j = await res.json();
        setData(j);
      } catch (_) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      {loading ? (
        <ActivityIndicator color="#22d3ee" />
      ) : data ? (
        <View style={styles.card}>
          <Text style={styles.item}>Sessions: {data.sessionsCount}</Text>
          <Text style={styles.item}>Heatmap points: {data.heatmapPoints}</Text>
          <Text style={styles.item}>Emergencies: {data.emergenciesCount}</Text>
        </View>
      ) : (
        <Text style={styles.item}>No data.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050508", padding: 24 },
  title: { color: "#22d3ee", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  card: {
    borderWidth: 2,
    borderColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#0c1222",
  },
  item: { color: "#e2e8f0", fontSize: 16, marginVertical: 6 },
});
