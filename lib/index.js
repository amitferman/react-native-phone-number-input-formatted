import React, { PureComponent } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Platform } from "react-native";
import CountryPicker, {
  getCallingCode,
  DARK_THEME,
  DEFAULT_THEME,
  CountryModalProvider,
  Flag
} from "react-native-country-picker-modal";
import { PhoneNumberUtil } from "google-libphonenumber";
import styles from "./styles";

const dropDown =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAi0lEQVRYR+3WuQ6AIBRE0eHL1T83FBqU5S1szdiY2NyTKcCAzU/Y3AcBXIALcIF0gRPAsehgugDEXnYQrUC88RIgfpuJ+MRrgFmILN4CjEYU4xJgFKIa1wB6Ec24FuBFiHELwIpQxa0ALUId9wAkhCnuBdQQ5ngP4I9wxXsBDyJ9m+8y/g9wAS7ABW4giBshQZji3AAAAABJRU5ErkJggg==";
const phoneUtil = PhoneNumberUtil.getInstance();

const getNumerical = (text) => {
  return text.replace(/\D|| /g, "");
}

const phoneFormat = (input) => {
  input = input.replace(/\D|| /g,'').substring(0,10);
  var size = input.length;
  if (size > 0) {
    input = "(" + input
  }
  if (size >= 3) {
    input = input.slice(0,4) + ") " + input.slice(4)
  }
  if (size > 6) {
    input = input.slice(0, 9) + "-" + input.slice(9)
  }
  return input;
}

export default class PhoneInput extends PureComponent {
  inputRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      code: props.defaultCode ? undefined : "91",
      numberNumerical: props.value // model
      ? getNumerical(props.value)
      : props.defaultValue
      ? getNumerical(props.defaultValue)
      : "",
      number: props.value // view
        ? phoneFormat(getNumerical(props.value))
        : props.defaultValue
        ? phoneFormat(getNumerical(props.defaultValue))
        : "",
      modalVisible: false,
      countryCode: props.defaultCode ? props.defaultCode : "IN",
      disabled: props.disabled || false,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.disabled !== prevState.disabled) {
      if ((nextProps.value || nextProps.value === "") && nextProps.value !== prevState.number) {
        return ({ disabled: nextProps.disabled, number: nextProps.value });
      }
      return ({ disabled: nextProps.disabled });
    }
    return null;
  };

  async componentDidMount() {
    //this.openKeyboard()
    const { defaultCode } = this.props;
    if (defaultCode) {
      const code = await getCallingCode(defaultCode);
      this.setState({ code });
    }
  }

  getCountryCode = () => {
    return this.state.countryCode;
  };

  getCallingCode = () => {
    return this.state.code;
  };

  isValidNumber = (number) => {
    try {
      const { countryCode } = this.state;
      const parsedNumber = phoneUtil.parse(number, countryCode);
      return phoneUtil.isValidNumber(parsedNumber);
    } catch (err) {
      return false;
    }
  };

  openKeyboard = () => {
    const textInput = this.inputRef.current;
    // Two workaround allow this to work.
    // Workaround 1: RN Bug for Android (https://github.com/facebook/react-native/issues/19366)
    // Workaround 2: wait 100ms for components to render
    if (Platform.OS == 'android') {
      setTimeout(() => {
        textInput.blur()
        textInput.focus()
      }, 100);
    } else {
      setTimeout(() => textInput.focus(), 100);
    }
    // Ensure country picker modal is closed
    this.setState({ modalVisible: false })
  }

  onSelect = (country) => {
    const { onChangeCountry } = this.props;
    this.setState(
      {
        countryCode: country.cca2,
        code: country.callingCode[0],
      },
      () => {
        const { onChangeFormattedText } = this.props;
        if (onChangeFormattedText) {
          if (country.callingCode[0]) {
            onChangeFormattedText(
              `+${country.callingCode[0]}${this.state.number}`
            );
          } else {
            onChangeFormattedText(this.state.number);
          }
        }
      }
    );
    if (onChangeCountry) {
      onChangeCountry(country);
    }
  };

  onKeyPress = ({ nativeEvent }) => {
    const { onChangeText, onChangeFormattedText } = this.props;
    const {numberNumerical, number} = this.state;
    let newNumberNumerical, newNumber;
    const { key } = nativeEvent;
    if (key == 'Backspace') {
      newNumberNumerical = numberNumerical.slice(0, -1);
    } else {
      newNumberNumerical = getNumerical(numberNumerical + key).slice(0, 10);
    }
    newNumber = phoneFormat(newNumberNumerical)
    this.setState({ 
      numberNumerical: newNumberNumerical, 
      number: newNumber
    });
    if (onChangeText) {
      onChangeText(newNumber);
    }
    if (onChangeFormattedText) {
      const { code } = this.state;
      if (code) {
        onChangeFormattedText(newNumber.length > 0 ? `+${code}${newNumber}` : newNumber);
      } else {
        onChangeFormattedText(newNumber);
      }
    }
  }

  getNumberAfterPossiblyEliminatingZero() {
    let { number, code } = this.state;
    if (number.length > 0 && number.startsWith("0")) {
      number = number.substr(1);
      return { number, formattedNumber: code ? `+${code}${number}` : number };
    } else {
      return { number, formattedNumber: code ? `+${code}${number}` : number };
    }
  }

  renderDropdownImage = () => {
    return (
      <Image
        source={{ uri: dropDown }}
        resizeMode="contain"
        style={styles.dropDownImage}
      />
    );
  };

  renderFlagButton = (props) => {
    const { layout = "first", flagSize } = this.props;
    const { countryCode } = this.state;
    if (layout === "first") {
      return (
        <Flag
          countryCode={countryCode}
          flagSize={flagSize ? flagSize : DEFAULT_THEME.flagSize}
        />
      );
    }
    return <View />;
  };

  render() {
    const {
      withShadow,
      withDarkTheme,
      codeTextStyle,
      textInputProps,
      textInputStyle,
      autoFocus,
      placeholder,
      disableArrowIcon,
      flagButtonStyle,
      containerStyle,
      textContainerStyle,
      renderDropdownImage,
      countryPickerProps = {},
      filterProps = {},
      countryPickerButtonStyle,
      layout = "first",
    } = this.props;
    const { modalVisible, code, countryCode, number, disabled } = this.state;
    return (
      <CountryModalProvider>
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'center'}}>
          <View
            style={[
              styles.container,
              withShadow ? styles.shadow : {},
              containerStyle ? containerStyle : {},
            ]}
          >
            <TouchableOpacity
              style={[
                styles.flagButtonView,
                layout === "second" ? styles.flagButtonExtraWidth : {},
                flagButtonStyle ? flagButtonStyle : {},
                countryPickerButtonStyle ? countryPickerButtonStyle : {},
              ]}
              disabled={disabled}
              onPress={() => this.setState({ modalVisible: true })}
            >
              <CountryPicker
                onSelect={this.onSelect}
                withEmoji
                withFilter
                withFlag
                filterProps={filterProps}
                countryCode={countryCode}
                withCallingCode
                disableNativeModal={disabled}
                visible={modalVisible}
                theme={withDarkTheme ? DARK_THEME : DEFAULT_THEME}
                renderFlagButton={this.renderFlagButton}
                onClose={this.openKeyboard}
                {...countryPickerProps}
              />
              {code && layout === "second" && (
                <View>
                  <Text
                    style={[styles.codeText, codeTextStyle ? codeTextStyle : {}]}
                  >{`+${code}`}</Text>
                </View>
              )}
              {!disableArrowIcon && (
                <React.Fragment>
                  {renderDropdownImage
                    ? renderDropdownImage
                    : this.renderDropdownImage()}
                </React.Fragment>
              )}
            </TouchableOpacity>
            <View
              style={[
                styles.textContainer,
                textContainerStyle ? textContainerStyle : {},
              ]}
            >
              {code && layout === "first" && (
                <Text
                  style={[styles.codeText, codeTextStyle ? codeTextStyle : {}]}
                >{`+${code}`}</Text>
              )}
              <TouchableOpacity onPress={this.openKeyboard} activeOpacity={1}>
                <View pointerEvents="none">
                  <TextInput
                    ref={this.inputRef}
                    style={[styles.numberText, textInputStyle ? textInputStyle : {}]}
                    placeholder={placeholder ? placeholder : "Phone Number"}
                    onKeyPress={this.onKeyPress}
                    value={number}
                    editable={disabled ? false : true}
                    selectionColor="transparent"
                    keyboardAppearance={withDarkTheme ? "dark" : "default"}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={14}
                    pointerEvents="none"
                    {...textInputProps}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CountryModalProvider>
    );
  }
}

export const isValidNumber = (number, countryCode) => {
  try {
    const parsedNumber = phoneUtil.parse(number, countryCode);
    return phoneUtil.isValidNumber(parsedNumber);
  } catch (err) {
    return false;
  }
};
