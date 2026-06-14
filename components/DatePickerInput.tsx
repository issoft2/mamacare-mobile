/**
 *  components/DatePickerInput.tsx
 * Reusable Pregnancy & Profile Calendar Selection Input
 */


import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { 
    Platform,
    Modal, 
    StyleSheet, 
    Text, 
    TouchableOpacity,
    View
} from "react-native";
import { useState} from 'react';
import { colors } from "@safeborn/ui";
import { AUTH_UI, FONT_FRIENDLY_SANS } from '@/lib/authUiTokens';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerInputProps {
    label: string;
    value: string; // YYYY-MM-DD string format
    onChange: (formattedDate: string) => void;
    placeholder?: string;
    maximumDate?: Date;
    minimumDate?: Date;
}

export function DatePickerInput({
    label,
    value,
    onChange,
    placeholder = "Select date",
    maximumDate,
    minimumDate,
}: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  // Parse YYYY-MM-DD string backe to a local JS Date object for the picker UI
  const  getPickerDate = (): Date => {
    if (!value) return maximumDate || new Date();
    const parts = value.split("-");
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return maximumDate || new Date();
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Android dismisses the picker model via UI events
    if (Platform.OS === 'android') {
        setShow(false);
    }

    if (event.type === 'set' && selectedDate) {
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  const renderPickerElement = () => (
    <DateTimePicker
     value={getPickerDate()}
     mode="date"
     display={Platform.OS === 'ios' ? 'spinner' : 'default'}
     onChange={handleDateChange}
     maximumDate={maximumDate}
     minimumDate={minimumDate}
     
     />
  );

  return (
    <View style={styles.inputGroup} >

        <Text style={styles.label}>{label}</Text>

        <TouchableOpacity 
          style={styles.inputWithIcon }
          onPress={() => setShow(true)}
          activeOpacity={0.85}
          >
           <Ionicons name="calendar-outline" size={18} color={AUTH_UI.textBlack} style={styles.inputIcon } />
           <View style={styles.dummyInputFrame} >
             <Text style={[styles.dummyInputText, !value && { color: colors.gray[400]}]}>
                {value || placeholder }
             </Text>
           </View>
          </TouchableOpacity>

          {Platform.OS === "ios" ? (
            <Modal transparent visible={show} animationType="slide" onRequestClose={() => setShow(false)} >
                <View style={styles.iosModalContainer}>
                    <View style={styles.iosPickerHeader}>
                        <TouchableOpacity onPress={() => setShow(false)}>
                            <Text style={styles.iosDoneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.iosPickerBody}>
                        {renderPickerElement()}
                    </View>
                </View>
            </Modal>
          ) : show ? (
            renderPickerElement()
          ) : null}
    </View>
  );
}


// -- STYLE
const styles = StyleSheet.create({
    inputGroup: { gap: 8},
    label : { fontSize: 14, fontWeight:  "600", color: AUTH_UI.textBlack, marginLeft: 2, fontFamily: FONT_FRIENDLY_SANS},
    inputWithIcon: { flexDirection: "row", alignItems: "center", backgroundColor: AUTH_UI.textWhite, borderRadius: AUTH_UI.inputRadius, borderWidth: AUTH_UI.borderWidth, borderColor: colors.rose[200]},
    inputIcon: { marginLeft: 15},
    dummyInputFrame: { flex: 1, paddingHorizontal: AUTH_UI.fieldPaddingX, paddingVertical: AUTH_UI.fieldPaddingY, justifyContent: "center"},
    dummyInputText: { fontSize: 16, color: AUTH_UI.textBlack, fontFamily: FONT_FRIENDLY_SANS},
    iosModalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4" },
    iosPickerHeader: { backgroundColor: colors.gray[100], padding: 16, alignItems: "flex-end", borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 1, borderColor: colors.gray[200] },
    iosDoneText: { color: colors.rose[500], fontWeight: "700", fontSize: 16, fontFamily: FONT_FRIENDLY_SANS },
    iosPickerBody: { backgroundColor: AUTH_UI.textWhite, paddingBottom: 32 },

});