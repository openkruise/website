import React from 'react';
import ReactDOM from 'react-dom';
import { getScrollTop, getLink } from '../../../utils';
import Header from '../../components/header';
import Button from '../../components/button';
import Footer from '../../components/footer';
import Language from '../../components/language';
import Bone from '../../components/bone';
import FunctionItem from './functionItem';
import FeatureItem from './featureItem';
import homeConfig from '../../../site_config/home';
import './index.scss';

class Home extends Language {

  constructor(props) {
    super(props);
    this.state = {
      headerType: 'primary',
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', () => {
      const scrollTop = getScrollTop();
      if (scrollTop > 66) {
        this.setState({
          headerType: 'normal',
        });
      } else {
        this.setState({
          headerType: 'primary',
        });
      }
    });
  }

  render() {
    const language = this.getLanguage();
    const dataSource = homeConfig[language];
    const { headerType } = this.state;
    const headerLogo = headerType === 'primary' ? '/img/kruise_white.png' : '/img/kruise_colorful.png';
    return (
      <div className="home-page">
        <section className="top-section" id="top-section">
          <div className="mask" />
          <Header
            currentKey="home"
            type={headerType}
            logo={headerLogo}
            language={language}
            onLanguageChange={this.onLanguageChange}
          />
          <div className="vertical-middle">
            <div className="product-name">
              <h2>{dataSource.brand.brandName}</h2>
            </div>
            <p className="product-desc">{dataSource.brand.briefIntroduction}</p>
            <div className="button-area">
            {
              dataSource.brand.buttons.map(b => <Button type={b.type} key={b.type} link={b.link} target={b.target}>{b.text}</Button>)
            }
            </div>
          </div>
        </section>
        <section className="introduction-section">
          <div className="introduction-body">
            <div className="introduction">
              <h3>{dataSource.introduction.title}</h3>
              <p>{dataSource.introduction.desc}</p>
            </div>
            <img src={getLink(dataSource.introduction.img)} />
          </div>
        </section>
	<section className="function-section">
           <h3>{dataSource.functions.title}</h3>
           <Bone type="dark" />
           <div>
               {
                   dataSource.functions.list.map((func, i) => (
                   <FunctionItem func={func} key={i} imgFirst={i % 2 === 0} />
                   ))
               }
            </div>
        </section>    
        <section className="feature-section">
          <div className="feature-section-body">
            <h3>{dataSource.features.title}</h3>
            <Bone type="light" />
            <ul className="feature-list">
               {
                   dataSource.features.list.map((feature, i) => (
                   <FeatureItem feature={feature} key={i} />
                   ))
               }
            </ul>
          </div>
        </section>
	<section className="users-section">
            <h3>{dataSource.users.title}</h3>
            <Bone type="dark" />
            <p>{dataSource.users.desc}</p>
            <div className="users">
               {
                   dataSource.users.list.map((user, i) => (
                   <div className="user-item" key={i}>
                        <img src={user} />
                   </div>
                  ))
               }
          </div>
        </section>    
        <Footer logo="/img/kruise_gray.png" language={language} />
      </div>
    );
  }
}

document.getElementById('root') && ReactDOM.render(<Home />, document.getElementById('root'));

export default Home;
