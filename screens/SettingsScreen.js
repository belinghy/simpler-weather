import React from "react";
import {
  FlatList,
  Linking,
  Text,
  TextInput,
  View,
  StyleSheet
} from "react-native";
import { TextField } from "react-native-material-textfield";
import { SecureStore } from "expo";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

import { DARKSKY_TOKEN_KEY } from "../constants/Constants";

const mapStateToProps = state => ({
  status: state
});

const mapDispatchToProps = dispatch => ({
  setSettings: () => {
    dispatch({ type: "SET_SETTINGS" });
  }
});

class SettingsItem extends React.Component {
  render() {
    const { index, item, onChangeText } = this.props;
    return (
      <TextField
        label={item.key}
        value={item.value}
        defaultValue={item.value}
        onChangeText={text => {
          onChangeText(index, text);
        }}
      />
    );
  }
}

class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: "Settings"
  };

  constructor(props) {
    super(props);

    this.state = {
      settings: [{ key: "Darksky Token", value: "" }]
    };
  }

  componentWillMount() {
    SecureStore.getItemAsync(DARKSKY_TOKEN_KEY)
      .then(value => {
        this.setState({ settings: [{ key: "Darksky Token", value: value }] });
      })
      .catch(error => console.log(error));
  }

  _handleChangedSettings = (index, text) => {
    let newSettings = [...this.state.settings];
    newSettings[index].value = text;
    this.setState({ settings: newSettings });

    SecureStore.setItemAsync(DARKSKY_TOKEN_KEY, text)
      .then(() => {
        this.props.setSettings();
      })
      .catch(error => {
        console.log(error);
      });
  };

  _handleExternalLink = url => {
    Linking.openURL(url);
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>General</Text>
        <FlatList
          data={this.state.settings}
          renderItem={({ item, index }) => (
            <SettingsItem
              index={index}
              item={item}
              onChangeText={this._handleChangedSettings}
            />
          )}
        />
        <View style={styles.containerRight}>
          <Text
            style={styles.link}
            onPress={() => {
              this._handleExternalLink("https://darksky.net/poweredby/");
            }}
          >
            Powered by Dark Sky
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24
  },
  heading: {
    fontSize: 24,
    fontWeight: "500"
  },
  containerRight: {
    alignItems: "flex-end"
  },
  link: {
    color: "#2980b9"
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(SettingsScreen);
