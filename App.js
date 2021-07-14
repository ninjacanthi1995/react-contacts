import React, { useEffect, useState } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import * as Contacts from "expo-contacts";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Button, Overlay, ListItem } from "react-native-elements";

export default function App() {
  const [contactList, setContactList] = useState([]);
  const [currentLat, setCurrentLat] = useState(0);
  const [currentLon, setCurrentLon] = useState(0);
  const [visible, setVisible] = useState(false);

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLat(location.coords.latitude);
      setCurrentLon(location.coords.longitude);

      status = await Contacts.requestPermissionsAsync();
      if (status.status === "granted") {
        let { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Addresses],
        });

        if (data.length > 0) {
          data = data.filter((contact) => contact.addresses);
          let list = [];
          for (let i = 0; i < data.length; i++) {
            let location = await Location.geocodeAsync(
              data[i].addresses[0].formattedAddress
            );
            console.log(currentLat);
            list.push({
              firstName: data[i].firstName,
              lastName: data[i].lastName,
              address: data[i].addresses[0].formattedAddress,
              coords: {
                latitude: location[0].latitude,
                longitude: location[0].longitude,
              },
              distance: distance(location[0].latitude, location[0].longitude, currentLat, currentLon)
            });
          }
          list.sort(
            (a, b) =>
              distance(
                a.coords.latitude,
                a.coords.longitude,
                currentLat,
                currentLon
              ) -
              distance(
                b.coords.latitude,
                b.coords.longitude,
                currentLat,
                currentLon
              )
          );
          setContactList(list);
        }
      }
    })();
  }, []);

  function deg2rad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
  }

  function rad2deg(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
  }

  function distance(lat1, lon1, lat2, lon2) {
    theta = lon1 - lon2;
    dist =
      Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.cos(deg2rad(theta));
    dist = Math.acos(dist);
    dist = rad2deg(dist) * 60 * 1.1515 * 1.609344;

    return dist;
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        <Marker
          coordinate={{ latitude: currentLat, longitude: currentLon }}
          title={"My position"}
          pinColor={"red"}
        />
        {contactList.map((contact, i) => (
          <Marker
            key={i}
            coordinate={{
              latitude: contact.coords.latitude,
              longitude: contact.coords.longitude,
            }}
            title={`${contact.firstName || ""} ${contact.lastName || ""}`}
            pinColor={"blue"}
          />
        ))}
      </MapView>
      <Button title="My contacts" onPress={toggleOverlay} />
      <Overlay
        isVisible={visible}
        onBackdropPress={toggleOverlay}
        overlayStyle={styles.overlay}
      >
        {contactList.map((contact, i) => (
          <ListItem key={i} bottomDivider>
            <ListItem.Content>
              <ListItem.Title>
                {`${contact.firstName || ""} ${contact.lastName || ""}`}
              </ListItem.Title>
              <ListItem.Subtitle>
                {`${contact.distance} Km`}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        ))}
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  overlay: {
    width: "80%",
    height: "80%",
    display: "flex",
    flexDirection: "column",
  },
});
