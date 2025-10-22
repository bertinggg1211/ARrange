import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ProductFilter = ({ onFilterChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'crystal', name: 'Crystal' },
    { id: 'modern', name: 'Modern' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'pendant', name: 'Pendant' },
    { id: 'ceiling', name: 'Ceiling' },
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.name);
    onFilterChange(category.id);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowFilter(!showFilter)}
      >
        <Icon name="filter" size={20} color="#333" />
        <Text style={styles.filterText}>Filter: {selectedCategory}</Text>
        <Icon 
          name={showFilter ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#333" 
        />
      </TouchableOpacity>

      {showFilter && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && styles.selectedCategory
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category.name && styles.selectedCategoryText
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  categoriesContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingVertical: 5,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  selectedCategory: {
    backgroundColor: '#FF6B00',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProductFilter;