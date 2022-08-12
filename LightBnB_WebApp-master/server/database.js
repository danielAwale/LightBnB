const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const theQuery = 'Select * From users WHERE users.email = $1;'
  return pool
    .query(theQuery, [email])
    .then((result) => {
      console.log(result.rows);
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    })

}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const theQuery = 'Select * From users WHERE users.id = $1;'
  return pool
    .query(theQuery, [id])
    .then((result) => {
      console.log(result.rows);
      if (result.rows) {
        return result.rows[0];
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err.message);
    })
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const theQuery = 'INSERT INTO users (name, email, password) Values ($1, $2, $3) RETURNING *;'

  return pool
    .query(theQuery, [user.name, user.email, user.password])
    .then(result => {
      return result.rows[0];
    })
    .catch(err => {
      console.log(err.message)
    })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const theQuery = 'SELECT reservations.*, properties.* FROM reservations JOIN properties ON reservations.property_id = properties.id JOIN property_reviews ON properties.id = property_reviews.property_id WHERE reservations.guest_id = $1 GROUP BY properties.id, reservations.id ORDER BY reservations.start_date LIMIT $2;'
  return pool
    .query(theQuery, [guest_id, limit])
    .then(result => {
      return result.rows;
    })
    .catch(err => {
      console.log(err.message);
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */


const getAllProperties = function(options, limit = 10) {
  // 1 make a empty array
  const queryParams = [];
  // 2 the staring query in a variable
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
`;
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND cost_per_night >= $${queryParams.length}`;
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND cost_per_night <= $${queryParams.length}`;
  }

  queryString += `GROUP BY properties.id `
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating * 100);
    queryString += `HAVING AVG(rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
    LIMIT $${queryParams.length};
`;
  return pool.query(queryString, queryParams).then((result) => result.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const theQuery = 'INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *;'

  return pool
    .query(theQuery, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code])
    .then(result => {
      return result.rows[0];
    })
    .catch(err => {
      console.log(err.message);
    })
}
exports.addProperty = addProperty;
