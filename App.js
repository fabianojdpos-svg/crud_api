import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import ListScreen from './screens/list';
import AddScreen from './screens/add';
import EditScreen from './screens/edit';

const Stack = createNativeStackNavigator();

export default function App() {
  console.log(process.env.EXPO_PUBLIC_VALOR);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="list">
        <Stack.Screen
          name="list"
          component={ListScreen}
          options={{ title: 'Agenda' }}
        />
        <Stack.Screen
          name="add"
          component={AddScreen}
          options={{ title: 'Cadastro' }}
        />
        <Stack.Screen
          name="edit"
          component={EditScreen}
          options={{ title: 'Alteração' }}
        />
      </Stack.Navigator>

      <StatusBar style="auto" />
      <Toast />
    </NavigationContainer>
  );
}