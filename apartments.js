var _ = require('lodash');

var Apartments = function() {
    this.data = [];
    this.initialize();
};

Apartments.prototype.addApartment = function(name, location, url, picture, 
    price) {
    var apartment =  {
        name: name,
        location: location,
        url: url,
        picture: picture,
        price: price
    };
    this.data.push(apartment);
};

Apartments.prototype.initialize = function() {
    this.addApartment('Gran Vía Suites', 'Barcelona', 
    'https://www.ericvokel.com/hotel?id=barcelona-gran-via-suites', 
    '01.jpg', 136);
    this.addApartment('Bcn Suites', 'Barcelona', 
    'https://www.ericvokel.com/hotel?id=barcelona-bcn-suites', 
    '02.jpg', 166);
    this.addApartment('Sagrada Familia Suites', 'Barcelona', 
    'https://www.ericvokel.com/hotel?id=barcelona-sagrada-familia-suites', 
    '03.jpg', 190);

    this.addApartment('Madrid Suites', 'Madrid', 
    'https://www.ericvokel.com/hotel?id=madrid-madrid-suites', 
    '04.jpg', 120);
    this.addApartment('Atocha Suites', 'Madrid', 
    'https://www.ericvokel.com/hotel?id=madrid-atocha-suites', 
    '05.jpg', 151);
};

Apartments.prototype.get = function(location) {
    return _.filter(this.data, function(apartment) {
        return apartment.location.toLowerCase() === location.toLowerCase();
    });
}

Apartments.prototype.isValidCity = function(city) {
    city = city.toLowerCase();
    return ((city === 'madrid') || (city === 'barcelona'));
}

var instance = new Apartments();

module.exports = instance;