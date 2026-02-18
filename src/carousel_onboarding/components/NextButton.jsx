import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AntDesign from 'react-native-vector-icons/AntDesign';
import styles from './styles/NextButton.styles';

export default function NextButton({ percentage, scrollTo }) {
  const size = 100;
  const strokeWidth = 2;
  const center = size / 2;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(null);

  const animation = (toValue) => {
    Animated.timing(progressAnimation, {
      toValue,
      duration: 250,
      useNativeDriver: false, 
    }).start();
  };

  useEffect(() => {
    animation(percentage);
  }, [percentage]);

  useEffect(() => {
    const listener = progressAnimation.addListener((value) => {
      const strokeDashoffset = circumference - (circumference * value.value) / 100;

      if (progressRef?.current) {
        progressRef.current.setNativeProps({
          strokeDashoffset,
        });
      }
    });

    return () => {
      progressAnimation.removeListener(listener);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#FFB380"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        <Circle
          ref={progressRef}
          stroke="#FF8B47"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </Svg>

      <TouchableOpacity onPress={scrollTo} style={styles.button} activeOpacity={0.8}>
        <AntDesign name="arrowright" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}