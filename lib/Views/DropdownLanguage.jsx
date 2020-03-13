import React from "react";
import i18n from "terriajs/lib/Models/i18n";

class DropdownLanguage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      lang: i18n.language
    };
  }

  changeLanguage(lng) {
    i18n.changeLanguage(lng).then(_ => {
      this.setState({ ...this.state, lang: lng, isOpen: false });
    });
  }

  toggleLanguageSelector() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  render() {
    return (
      <div
        className={
          "dropdown dropdown-language " + (this.state.isOpen ? "active" : "")
        }
      >
        <button
          type="button"
          className={`dropwdown-toggle language-flag ${this.state.lang}`}
          onClick={this.toggleLanguageSelector.bind(this)}
        >
          {i18n.t(`app:language.${this.state.lang}`)}
        </button>
        <ul className="dropdown-content languages-list">
          <li
            className="language-item"
            onClick={() => this.changeLanguage("es")}
          >
            <a className="language-flag es">{i18n.t("app:language.es")}</a>
          </li>
          <li
            className="language-item"
            onClick={() => this.changeLanguage("en")}
          >
            <a className="language-flag en">{i18n.t("app:language.en")}</a>
          </li>
        </ul>
      </div>
    );
  }
}

export default DropdownLanguage;
