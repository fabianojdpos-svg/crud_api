import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../estilos';
import * as yup from 'yup';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Toast from 'react-native-toast-message';

export const schema = yup.object({
  name: yup.string().required('Por favor, informe um nome.'),
  phone: yup.string().required('Por favor, informe um telefone.'),
}).required();

export default function AddScreen({ navigation }) {
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

  const [busy, setBusy] = useState(false);

  const onSubmit = async (data) => {
    setBusy(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_API_KEY,
        },
        body: JSON.stringify(data),
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

        // Navega de volta enviando o parâmetro de atualização para a lista
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
              placeholder="Nome"
              keyboardType="default"
              onChangeText={onChange}
              value={value}
              style={estilosAdd.input}
              autoFocus={true}
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
              placeholder="Telefone"
              keyboardType="phone-pad"
              onChangeText={onChange}
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
        title="Salvar"
      />
    </SafeAreaView>
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