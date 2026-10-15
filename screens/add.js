import { useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../estilos';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

// Função de máscara local para telefone
export const formatPhone = (text) => {
  if (!text) return '';
  const cleaned = text.replace(/\D/g, ''); // Remove caracteres não numéricos

  if (cleaned.length > 10) {
    // Formato: (XX) XXXXX-XXXX
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (cleaned.length > 6) {
    // Formato: (XX) XXXX-XXXX
    return cleaned.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (cleaned.length > 2) {
    // Formato: (XX) XXXX
    return cleaned.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return cleaned;
};

// Esqueletos de validação aprimorados
export const schema = yup.object({
  name: yup
    .string()
    .transform((value) => (value ? value.trim() : ''))
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .required('Por favor, informe um nome.'),
  phone: yup
    .string()
    .required('Por favor, informe um telefone.')
    .test('phone-length', 'Informe um telefone válido com DDD (10 ou 11 dígitos).', (val) => {
      if (!val) return false;
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    }),
}).required();

export default function AddScreen({ navigation }) {
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
    },
    resolver: yupResolver(schema),
  });

  // Foca no campo Nome automaticamente ao abrir a tela
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const onSubmit = async (data) => {
    setBusy(true);
    Keyboard.dismiss();

    // Limpa espaços em branco nas extremidades dos textos
    const dadosFormatados = {
      name: data.name.trim(),
      phone: data.phone.trim(),
    };

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
        body: JSON.stringify(dadosFormatados),
      });

      let message = '';
      try {
        const json = await response.json();
        message = json.message || JSON.stringify(json);
      } catch {
        message = await response.text();
      }

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Sucesso',
          text2: message || 'Contato salvo com sucesso.',
          position: 'bottom',
        });

        // Retorna para a tela anterior e aciona a atualização da lista
        navigation.navigate('list', { atualizar: true });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erro',
          text2: message || 'Não foi possível cadastrar o contato.',
          position: 'bottom',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Houve um erro de conexão ao salvar o contato.',
        position: 'bottom',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={globalStyles.container}>
        <Text style={{ fontSize: 24, marginBottom: 20 }}>
          Cadastro de nova entrada
        </Text>

        <View style={{ marginBottom: 15 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                ref={nameInputRef}
                placeholder="Nome"
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                onChangeText={onChange}
                value={value}
                style={estilosAdd.input}
              />
            )}
          />
          {errors.name && (
            <Text style={estilosAdd.error}>{errors.name.message}</Text>
          )}
        </View>

        <View style={{ marginBottom: 15 }}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                ref={phoneInputRef}
                placeholder="Telefone ex: (17) 99999-8889"
                keyboardType="phone-pad"
                maxLength={15}
                onChangeText={(text) => onChange(formatPhone(text))}
                value={value}
                style={estilosAdd.input}
              />
            )}
          />
          {errors.phone && (
            <Text style={estilosAdd.error}>{errors.phone.message}</Text>
          )}
        </View>

        <ActivityIndicator size="large" animating={busy} color="#0000ff" />

        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={busy}
          title={busy ? "Salvando..." : "Salvar"}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

export const estilosAdd = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: 300,
    padding: 10,
    fontSize: 18,
    borderRadius: 5,
  },
  error: {
    color: 'crimson',
    marginTop: 5,
  },
});