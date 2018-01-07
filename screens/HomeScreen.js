import React from "react";
import {
  Platform,
  Button,
  FlatList,
  Text,
  View,
  StyleSheet
} from "react-native";
import { TextField } from "react-native-material-textfield";
import PTRView from "react-native-pull-to-refresh";
import { Constants, Location, Permissions, SecureStore } from "expo";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

import { DARKSKY_TOKEN_KEY } from "../constants/Constants";

const mapStateToProps = state => ({
  status: state
});

class WeatherItem extends React.Component {
  render() {
    const { index, item } = this.props;
    return (
      <View
        style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}
      >
        <Text
          style={{
            textAlignVertical: "center",
            fontSize: 20,
            fontWeight: "400",
            marginLeft: 10,
            marginRight: 10
          }}
        >
          {item.time}
        </Text>
        <Text
          style={{
            textAlignVertical: "center",
            fontSize: 16,
            fontWeight: "400",
            marginLeft: 10,
            marginRight: 10
          }}
        >
          {item.temp}
        </Text>
        <Text
          style={{
            textAlignVertical: "center",
            fontSize: 16,
            fontWeight: "400",
            marginLeft: 10,
            marginRight: 10
          }}
        >
          {item.precip}
        </Text>
        <Text
          style={{
            textAlignVertical: "center",
            fontSize: 16,
            fontWeight: "400",
            marginLeft: 10,
            marginRight: 10
          }}
        >
          {item.uvIndex}
        </Text>
      </View>
    );
  }
}

class WeatherScreen extends React.Component {
  static navigationOptions = {
    title: "Weather"
  };

  constructor(props) {
    super(props);

    this.state = {
      location: null,
      coordinates: null,
      errorMessage: null,
      darkskyToken: null,
      weather: null,
      refreshing: false
    };

    SecureStore.getItemAsync(DARKSKY_TOKEN_KEY)
      .then(value => {
        this.state.darkskyToken = value;
      })
      .catch(error => console.log(error));
  }

  componentWillMount() {
    if (Platform.OS === "android" && !Constants.isDevice) {
      this.setState({
        errorMessage: "Oops, something is wrong with your device!"
      });
    } else {
      this._getLocationAsync().then(({ latitude, longitude }) => {
        this._getDarkskyWeatherAsync(latitude, longitude);
      });
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied"
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    this.setState({ location });
    return { latitude, longitude };
  };

  _getDarkskyWeatherAsync = async (latitude, longitude, token) => {
    const darkskyBaseUrl = "https://api.darksky.net/forecast";
    const _token = token || this.state.darkskyToken;
    try {
      let response = await fetch(
        darkskyBaseUrl +
          `/${_token}/` +
          `${latitude},${longitude}` +
          `?units=ca`
      );
      let responseJson = await response.json();
      this.setState({ weather: responseJson, darkskyToken: _token });
    } catch (error) {
      console.log(error);
    }
  };

  _pullRefresh() {
    const { latitude, longitude } = this.state.location.coords;

    if (!this.state.weather) {
      // No weather, should update token
      SecureStore.getItemAsync(DARKSKY_TOKEN_KEY)
        .then(token => {
          this._getDarkskyWeatherAsync(latitude, longitude, token);
        })
        .catch(error => console.log(error));
    } else {
      this._getDarkskyWeatherAsync(latitude, longitude);
    }
  }

  _renderWeatherInfo() {
    if (this.state.weather) {
      const { weather } = this.state;
      const formattedWeather = weather.hourly.data.slice(0, 12).map(item => {
        let hour = new Date(parseInt(item.time) * 1000).getHours(); // 0 - 23
        let hourSuffix = hour >= 12 ? "pm" : "am";
        hour = hour % 12;
        hour = hour == 0 ? 12 : hour;

        let { apparentTemperature, precipIntensity, uvIndex } = item;

        return {
          time: `${hour}${hourSuffix}`,
          temp: `${Math.round(apparentTemperature)}°C`,
          precip: `${Math.round(precipIntensity)}mm`,
          uvIndex: `${Math.round(uvIndex)}uv`
        };
      });

      const currentDateTime = new Date(parseInt(weather.currently.time) * 1000);
      const _year = currentDateTime.getFullYear();
      const _month = ("0" + (currentDateTime.getMonth() + 1)).substr(-2, 2);
      const _date = ("0" + currentDateTime.getDate()).substr(-2, 2);

      return (
        <View style={styles.container}>
          <Text style={{ textAlign: "center", marginBottom: 24, fontSize: 24 }}>
            {`${_year}-${_month}-${_date}`}
          </Text>
          <Text style={{ textAlign: "center", marginBottom: 24, fontSize: 24 }}>
            {weather.hourly.summary}
          </Text>
          <FlatList
            data={formattedWeather}
            renderItem={({ item, index }) => (
              <WeatherItem index={index} item={item} />
            )}
          />
        </View>
      );
    } else {
      return (
        <View>
          <Text>{`No weather information available.`}</Text>
        </View>
      );
    }
  }

  render() {
    let text = "Waiting..";
    let latitude,
      longitude,
      timestamp = null;

    if (this.state.errorMessage) {
      text = this.state.errorMessage;
    } else if (this.state.location) {
      text = JSON.stringify(this.state.location);
      const { coords } = this.state.location;
      latitude = coords.latitude;
      longitude = coords.longitude;
      timestamp = this.state.location.timestamp;
    }

    return (
      <View style={{ flex: 1 }}>
        <PTRView onRefresh={this._pullRefresh.bind(this)}>
          <View style={styles.container}>{this._renderWeatherInfo()}</View>
        </PTRView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Constants.statusBarHeight,
    paddingLeft: 20,
    paddingRight: 20
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: "center"
  }
});

export default connect(mapStateToProps)(WeatherScreen);
