import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../../contexts/UserContext';
import CustomAlertModal from '../../Components/CustomAlertModal';

type RootStackParamList = {
  InsoleQuestions: {
    customer: any;
    RetailerId: string;
  };
  InsoleRecommendation: { recommendedInsole: 'Sport' | 'Comfort' | 'Stability' };
  ShoesSize: {
    answers: any,
    gender: string,
    recommendedInsole: 'Sport' | 'Comfort' | 'Stability'
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InsoleQuestions'>;

type AnswerType = {
  ageGroup: string;
  activityLevel: string;
  painLocation: string;
  painFrequency: string;
  footPosture: string;
  archType: string;
  medicalCondition: string;
};

type ScoreType = {
  Sport: number;
  Comfort: number;
  Stability: number;
};

const options = {
  ageGroup: ['Under 18', '18-40', '41-60', '60+'],
  activityLevel: ['Sedentary', 'Moderate', 'Active'],
  painLocation: ['Heel', 'Arch', 'Forefoot', 'Knee', 'Lower Back'],
  painFrequency: ['Sometimes', 'Regularly', 'Permanently'],
  footPosture: ['Normal', 'Rolling Inwards', 'Rolling Outwards'],
  archType: ['Flat', 'Normal', 'High Arch'],
  medicalConditions: ['None', 'Plantar Fasciitis', 'Bunions', 'Others'],
};

// Function to calculate age group from DOB
const calculateAgeGroup = (dob: string): string => {
  if (!dob) return '';

  // Parse DD/MM/YYYY format
  const [day, month, year] = dob.split('/').map(num => parseInt(num, 10));
  const birthDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  // Check if birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age >= 0 && age <= 40) return '18-40';
  if (age >= 41 && age <= 60) return '41-60';
  if (age > 60) return '60+';
  return '';
};

const InsoleQuestions = ({ route }: { route: any }) => {
  const navigation = useNavigation<NavigationProp>();
  const { userData } = useUser();
  const { customer, RetailerId } = route.params;
  const [answers, setAnswers] = useState<AnswerType>({
    ageGroup: '',
    activityLevel: '',
    painLocation: '',
    painFrequency: '',
    footPosture: '',
    archType: '',
    medicalCondition: '',
  });

  const [modalField, setModalField] = useState<keyof AnswerType | null>(null);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  // Auto-fill age group and activity level from userData
  useEffect(() => {
    if (userData) {
      // Set age group based on DOB
      const userDataWithDob = userData as any;
      if (userDataWithDob.dob) {
        const calculatedAgeGroup = calculateAgeGroup(userDataWithDob.dob);
        setAnswers(prev => ({ ...prev, ageGroup: calculatedAgeGroup }));
      }

      // Set activity level if available in userData
      if (userDataWithDob.activityLevel) {
        setAnswers(prev => ({ ...prev, activityLevel: userDataWithDob.activityLevel }));
      }
    }
  }, [userData]);

  const updateAnswer = (field: keyof AnswerType, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    setModalField(null);
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertModal({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, visible: false }));
  };

  const calculateRecommendation = async () => {
    // Check if all questions are answered
    const unansweredQuestions = Object.keys(answers).filter(key => answers[key as keyof AnswerType] === '');
    if (unansweredQuestions.length > 0) {
      showAlert('Incomplete Form', 'Please answer all questions before submitting.', 'error');
      return;
    }

    try {
      const scores: ScoreType = { Sport: 0, Comfort: 0, Stability: 0 };

      if (answers.ageGroup === '18-40' || answers.ageGroup === 'Under 18') scores.Sport += 25;
      else if (answers.ageGroup === '41-60') scores.Comfort += 25;
      else if (answers.ageGroup === '60+') scores.Stability += 25;

      if (answers.activityLevel === 'Active') scores.Sport += 25;
      else if (answers.activityLevel === 'Moderate') scores.Comfort += 25;
      else if (answers.activityLevel === 'Sedentary') scores.Stability += 25;

      if (answers.painLocation === 'Forefoot') scores.Sport += 20;
      else if (['Heel', 'Lower Back', 'Knee'].includes(answers.painLocation)) scores.Stability += 20;
      else scores.Comfort += 20;

      if (answers.painFrequency === 'Sometimes') scores.Comfort += 15;
      else if (answers.painFrequency === 'Regularly') scores.Comfort += 15;
      else if (answers.painFrequency === 'Permanently') scores.Stability += 15;
      else scores.Sport += 15;

      if (answers.footPosture === 'Rolling Inwards') scores.Stability += 10;
      else if (answers.footPosture === 'Rolling Outwards') scores.Comfort += 10;
      else if (answers.footPosture === 'Normal') scores.Sport += 10;

      if (answers.archType === 'Flat') scores.Stability += 5;
      else if (answers.archType === 'High Arch') scores.Sport += 5;
      else scores.Comfort += 5;

      const recommended = Object.keys(scores).reduce((a, b) =>
        scores[a as keyof ScoreType] > scores[b as keyof ScoreType] ? a : b
      ) as keyof ScoreType;

      const answersToSave = {
        ageGroup: answers.ageGroup,
        activityLevel: answers.activityLevel,
        painLocation: answers.painLocation,
        painFrequency: answers.painFrequency,
        footPosture: answers.footPosture,
        archType: answers.archType,
        medicalCondition: answers.medicalCondition,
      };

      navigation.navigate('ShoesSize', {
        answers: answersToSave,
        gender: customer.gender || 'male',
        recommendedInsole: recommended,
        customer: customer,
        RetailerId: RetailerId
      });
    } catch (error) {
      console.error('Error calculating recommendation:', error);
      showAlert('Error', 'Failed to calculate recommendation. Please try again.', 'error');
    }
  };

  const renderPicker = (label: string, field: keyof AnswerType, items: string[]) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          console.log('Opening modal for:', field);
          setModalField(field);
        }}
        style={styles.selectBox}
        activeOpacity={0.6}
      >
        <Text style={answers[field] ? styles.selectedText : styles.selectText}>
          {answers[field] || 'Select an option'}
        </Text>
        <IconButton
          icon="chevron-down"
          size={20}
          iconColor="#666"
          style={styles.selectIcon}
        />
      </TouchableOpacity>
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalField === field}
        onRequestClose={() => setModalField(null)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setModalField(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true} onTouchEnd={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={items}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    answers[field] === item && styles.selectedModalItem
                  ]}
                  onPress={() => {
                    console.log('Selected:', item);
                    updateAnswer(field, item);
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={answers[field] === item ? styles.selectedItemText : styles.modalItemText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button
              onPress={() => setModalField(null)}
              mode="contained"
              style={{ marginTop: 10, backgroundColor: '#00843D' }}
            >
              Cancel
            </Button>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderProgressBar = () => {
    const totalQuestions = 7; // Total number of questions reduced by 1
    const answeredQuestions = Object.values(answers).filter(answer => answer !== '').length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
        <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
      </View>
    );
  };
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Just a few quick questions to understand your feet better.</Text>
      <Text style={styles.headerSubtitle}>Your answers help us personalise your insole recommendation.</Text>
    </View>
  );

  const renderNavigationHeader = () => (
    <View style={styles.navigationHeader}>
      <IconButton
        icon="arrow-left"
        size={24}
        iconColor="#333"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      />
      <Text style={styles.navigationTitle}>Insole Questionnaire</Text>
      <View style={styles.rightPlaceholder} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderNavigationHeader()}
      <ScrollView contentContainerStyle={styles.container}>
        {renderHeader()}
        {renderProgressBar()}
        {renderPicker('Age Group', 'ageGroup', options.ageGroup)}
        {renderPicker('Activity Level', 'activityLevel', options.activityLevel)}
        {renderPicker('Where do you feel pain?', 'painLocation', options.painLocation)}
        {renderPicker('How often do you feel pain?', 'painFrequency', options.painFrequency)}
        {renderPicker('How do your feet feel when standing?', 'footPosture', options.footPosture)}
        {renderPicker('Foot Arch Type', 'archType', options.archType)}
        {renderPicker('Medical Conditions', 'medicalCondition', options.medicalConditions)}

        <TouchableOpacity style={styles.buttonContainer} onPress={calculateRecommendation}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  selectedText: {
    fontSize: 15,
    color: '#00843D',
    fontWeight: '500',
    flex: 1,
  },
  selectIcon: {
    margin: 0,
    padding: 0,
  },
  buttonContainer: {
    backgroundColor: '#00843D',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 10,
    maxHeight: '70%',
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedModalItem: {
    backgroundColor: 'rgba(0, 132, 61, 0.1)',
  },
  modalItemText: {
    color: '#333',
  },
  selectedItemText: {
    color: '#00843D',
    fontWeight: '500',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00843D',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    color: '#666',
    fontSize: 12,
  },
  headerContainer: {
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    margin: 0,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  rightPlaceholder: {
    width: 40,
  },
});

export default InsoleQuestions;
