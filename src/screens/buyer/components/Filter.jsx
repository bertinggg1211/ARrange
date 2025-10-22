import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const Filter = ({ visible, onClose, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({
    style: [],
    material: [],
    finish: [],
    size: [],
    lights: [],
    height: [],
    bulb: [],
    mount: [],
    price: [],
    brand: [],
  });

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const filterOptions = {
    style: ['Modern', 'Contemporary', 'Minimalist', 'Industrial', 'Rustic', 'Farmhouse', 'Mid-Century', 'Traditional', 'Luxury/Crystal'],
    material: ['Crystal', 'Glass', 'Metal', 'Brass', 'Wood', 'Acrylic', 'Fabric Shade'],
    finish: ['Gold', 'Black', 'Chrome', 'Nickel', 'Bronze', 'White', 'Brass', 'Mixed'],
    size: ['Small (<18")', 'Medium (18–30")', 'Large (30–40")', 'Extra-Large (40"+)'],
    lights: ['1–3 Lights', '4–6 Lights', '7–9 Lights', '10+ Lights'],
    height: ['Adjustable', 'Fixed'],
    bulb: ['LED', 'Incandescent', 'Halogen', 'CFL', 'Smart Bulbs Compatible'],
    mount: ['Flush Mount', 'Semi-Flush', 'Hanging', 'Chain Suspension', 'Rod Suspension'],
    price: ['₱1,000–₱5,000', '₱5,001–₱10,000', '₱10,001–₱25,000', '₱25,001+'],
    brand: ['Brand A', 'Brand B', 'Brand C', 'Brand D'], // Replace with actual brands
  };

  const filterCategories = [
    { key: 'style', title: 'Style / Design', options: filterOptions.style },
    { key: 'material', title: 'Material', options: filterOptions.material },
    { key: 'finish', title: 'Finish / Color', options: filterOptions.finish },
    { key: 'size', title: 'Size / Diameter', options: filterOptions.size },
    { key: 'lights', title: 'Number of Lights', options: filterOptions.lights },
    { key: 'height', title: 'Height Adjustability', options: filterOptions.height },
    { key: 'bulb', title: 'Bulb Type', options: filterOptions.bulb },
    { key: 'mount', title: 'Mount Type', options: filterOptions.mount },
    { key: 'price', title: 'Price Range', options: filterOptions.price },
    { key: 'brand', title: 'Brand / Seller', options: filterOptions.brand },
  ];

  const toggleFilter = (category, option) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(option)
        ? prev[category].filter(item => item !== option)
        : [...prev[category], option]
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      style: [],
      material: [],
      finish: [],
      size: [],
      lights: [],
      height: [],
      bulb: [],
      mount: [],
      price: [],
      brand: [],
    });
  };

  const applyFilters = () => {
    // Exit animation before applying filters
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onApplyFilters(selectedFilters);
      onClose();
    });
  };

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getTotalSelectedCount = () => {
    return Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
              opacity: opacityAnim,
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filter</Text>
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filterCategories.map((category) => (
              <View key={category.key} style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>{category.title}</Text>
                <View style={styles.optionsContainer}>
                  {category.options.map((option) => {
                    const isSelected = selectedFilters[category.key].includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          isSelected && styles.optionButtonSelected
                        ]}
                        onPress={() => toggleFilter(category.key, option)}
                      >
                        <Text style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {getTotalSelectedCount()} filters selected
              </Text>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    minHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#FF8B47',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterGroup: {
    marginVertical: 16,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: '#FF8B47',
    borderColor: '#FF8B47',
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  selectedCount: {
    flex: 1,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#666666',
  },
  applyBtn: {
    backgroundColor: '#FF8B47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Filter;
