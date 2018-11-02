const expect = require('expect');
const { generateMessage, generateLocationMessage } = require('./message');

describe('generateMessage', () => {

  it('should generate the correct message object', () => {

    const text = 'Hi';
    const from = 'Admin';
    const message = generateMessage(from, text);

    expect(message).toInclude({from, text});
    expect(message.createdAt).toBeA('number');

  });

});

describe('generateLocationMessage', () => {

  it('should generate the correct location object', () => {

    const from = 'Admin';
    const latitude = 123;
    const longitude = 321;
    const location = generateLocationMessage(from, latitude, longitude);

    expect(location).toInclude({ from });
    expect(location.createdAt).toBeA('number');
    expect(location.url).toBe(`https://www.google.com/maps?q=${latitude},${longitude}`);

  });

});

