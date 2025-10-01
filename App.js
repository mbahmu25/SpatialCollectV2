import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import SplashScreen from './src/pages/SpalashScreen';
import Peta from './src/pages/Peta';
import Home from './src/pages/Home';
import ProjectPage from './src/pages/ProjectPage';
import CreateProject from './src/pages/CreateProject';
import LayerList from './src/pages/LayerList';
import CreateLayer from './src/pages/CreateLayer';

const Stack = createNativeStackNavigator();
import React, {useEffect} from 'react';
import {getDBConnection, initDatabase} from './src/utils/db';
// import {Buffer} from 'buffer';
// import util from 'util';

// if (typeof global.Buffer === 'undefined') {
//   global.Buffer = Buffer;
// }

// if (typeof global.util === 'undefined') {
//   global.util = util;
// }

export default function App() {
  useEffect(() => {
    (async () => {
      await getDBConnection();
    })();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Project"
          component={ProjectPage}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CreateProject"
          component={CreateProject}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LayerList"
          component={LayerList}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CreateLayer"
          component={CreateLayer}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Peta"
          component={Peta}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
