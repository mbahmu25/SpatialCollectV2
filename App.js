import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/pages/SpalashScreen';
import Peta from "./src/pages/Peta"
import Home from "./src/pages/Home"
import ProjectPage from './src/pages/ProjectPage';
import CreateProject from './src/pages/CreateProject';

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer initialRouteName="SplashScreen">
      <Stack.Navigator>
        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{headerShown:false}}/>
        <Stack.Screen name="Peta" component={Peta} options={{headerShown:false}} />
        <Stack.Screen name="Home" component={Home} options={{headerShown:false}} />
        <Stack.Screen name="Project" component={ProjectPage} options={{headerShown:false}} />
        <Stack.Screen name="CreateProject" component={CreateProject} options={{headerShown:false}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

