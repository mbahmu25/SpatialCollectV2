import { View, Text } from 'react-native'
import React from 'react'
import tw from "twrnc"

const GpsLocation = ({posisiGPS}) => {

    const InfoLocation = ({nama}) => {
        return <View style={tw`flex-1 p-2 border-[0.3] border-gray-500`}>
            <Text style={tw`text-black`} numberOfLines={1}>{nama}</Text>
        </View>
    }

  return (
    <View style={tw`bg-white`}>
        <View style={tw`flex-row`}>
            <InfoLocation nama={`Lon : ${posisiGPS["longitude"]}`}/>
            <InfoLocation nama={`Lat : ${posisiGPS["latitude"]}`}/>
        </View>
        <View style={tw`flex-row`}>
            <InfoLocation nama={`Accuracy : ${posisiGPS["accuracy"]}`}/>
            <InfoLocation nama={`Altitude : ${posisiGPS["altitude"]}`}/>
        </View>
    </View>
  )
}

export default GpsLocation