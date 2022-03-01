package com.flamtkz_x.inbloc

import android.app.DatePickerDialog
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.tasks.Task
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.text.SimpleDateFormat
import java.util.*

class RegisterActivity : AppCompatActivity() {

    private val switchToLoginBtn: Button by lazy { findViewById<Button>(R.id.signUpButtonLoginPage) }
    private val registerBtn: Button by lazy { findViewById<Button>(R.id.signUpButtonRegister) }

    private val nameField: EditText by lazy { findViewById(R.id.nameRegister) }
    private val emailField: EditText by lazy { findViewById(R.id.emailRegister) }
    private val passwordField: EditText by lazy { findViewById(R.id.passwordRegister) }
    private val confirmPasswordField: EditText by lazy { findViewById(R.id.confirmPasswordRegister) }
    private val zipCodeField: EditText by lazy { findViewById(R.id.zipcodeRegister) }
    private val cityField: EditText by lazy { findViewById(R.id.cityRegister) }
    private val countryField: EditText by lazy { findViewById(R.id.countryRegister) }
    private val birthdayField: EditText by lazy { findViewById(R.id.birthdayRegister) }

    private val calendar: Calendar = Calendar.getInstance()
    private val progressBar: ProgressBar by lazy { findViewById<ProgressBar>(R.id.progressBar1) }

    private lateinit var auth: FirebaseAuth
    private lateinit var analytics: FirebaseAnalytics

    private val database = Firebase.database
    private val usersRef = database.getReference("users")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        auth = FirebaseAuth.getInstance()
        analytics = FirebaseAnalytics.getInstance(this)

        progressBar.visibility = ProgressBar.INVISIBLE

        // if already logged in, go to to login
        if (auth.currentUser != null) {
            finish()
        }

        // Switch to login page
        switchToLoginBtn.setOnClickListener {
            finish()
        }

        // Register Button
        registerBtn.setOnClickListener {
            val password = passwordField.text.toString().trim()
            if (password == confirmPasswordField.text.toString().trim()) {
                register(
                    nameField.text.toString().trim(),
                    emailField.text.toString().trim(),
                    passwordField.text.toString().trim(),
                    zipCodeField.text.toString().trim(),
                    cityField.text.toString().trim(),
                    countryField.text.toString().trim(),
                    birthdayField.text.toString().trim()
                )
            } else {
                passwordField.error = "Passwords do not match"
                confirmPasswordField.error = "Passwords do not match"
                passwordField.text.clear()
                confirmPasswordField.text.clear()
                passwordField.requestFocus()
            }
        }

        // Birthday field, shows a date picker dialog when clicked
        birthdayField.setText("dd/mm/yyyy")
        birthdayField.setOnClickListener {
            DatePickerDialog(
                this,
                { _, year, month, dayOfMonth ->
                    calendar.set(Calendar.YEAR, year)
                    calendar.set(Calendar.MONTH, month)
                    calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
                    val dateFormat = "dd/MM/yyyy"
                    val sdf = SimpleDateFormat(dateFormat, Locale.US)
                    birthdayField.setText(sdf.format(calendar.time))
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH)
            ).show()
        }
    }

    /**
     * Registers the user with [FirebaseAuth]
     *
     * It gives feedback to the user if the registration was successful or not
     * and logs with [FirebaseAnalytics].
     * After registering, the user is added to the database with given parameters. At the end,
     * the user gets a verification email and is redirected to the login page
     * (from there to the main activity).
     * @param username the username of the user
     * @param email the email of the user
     * @param password the password of the user
     * @param zipCode the zip code of the user
     * @param city the city of the user
     * @param country the country of the user
     * @param birthday the birthday of the user
     * @return void
     * @see [addUserToDB]
     * @see [onSuccessfulDBInsert]
     * @see [onFailedDBInsert]
     */
    private fun register(
        username: String,
        email: String,
        password: String,
        zipCode: String,
        city: String,
        country: String,
        birthday: String
    ) {
        if (!areFieldsValid(username, email, password, zipCode, city, country, birthday)) return
        toggleFields(false)
        progressBar.visibility = android.view.View.VISIBLE

        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                toggleFields(true)
                progressBar.visibility = android.view.View.GONE
                if (task.isSuccessful) {
                    // Sign in success, TODO: update UI with the signed-in user's information
                    Toast.makeText(this, "Registration successful", Toast.LENGTH_SHORT).show()
                    analytics.logEvent(
                        FirebaseAnalytics.Event.SIGN_UP,
                        Bundle().apply { // TODO: Test this
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                            putString(FirebaseAnalytics.Param.SUCCESS, "true")
                        })
                    addUserToDB(username, email, zipCode, city, country, birthday)
                } else {
                    // If sign up fails, display a message to the user.
                    Toast.makeText(baseContext, "Registration failed!", Toast.LENGTH_SHORT).show()
                    analytics.logEvent(FirebaseAnalytics.Event.SIGN_UP,
                        Bundle().apply { // TODO: Test this
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                            putString(FirebaseAnalytics.Param.SUCCESS, "false")
                        })
                }
            }
    }

    /**
     * Add the user to the database and sends a verification email on success
     *
     * It sends toasts on success and errors and logs events with [FirebaseAnalytics]
     * @param username the username of the user
     * @param email the email of the user
     * @param zipCode the zip code of the user
     * @param city the city of the user
     * @param country the country of the user
     * @param birthday the birthday of the user
     * @return void
     */
    private fun addUserToDB(
        username: String,
        email: String,
        zipCode: String,
        city: String,
        country: String,
        birthday: String
    ) {
        val user = auth.currentUser
        val uid = user!!.uid
        usersRef.child(uid).setValue(
            mapOf( //TODO: Maybe change to class user
                "username" to username,
                "email" to email,
                "zipCode" to zipCode,
                "city" to city,
                "country" to country,
                "birthday" to birthday
            )
        ).addOnCompleteListener { dbTask ->
            if (dbTask.isSuccessful) {
                onSuccessfulDBInsert(email)
            } else {
                onFailedDBInsert(dbTask)
            }
        }
    }

    /**
     * On failed database insert
     *
     * Logs an event with [FirebaseAnalytics] and shows a toast
     * @param dbTask the result of the database insert (Needed for the error message)
     * @return void
     */
    private fun onFailedDBInsert(dbTask: Task<Void>) {
        // If sign up fails, display a message to the user.
        Toast.makeText(baseContext, "Registration failed!", Toast.LENGTH_SHORT)
            .show()
        analytics.logEvent(FirebaseAnalytics.Event.SIGN_UP,
            Bundle().apply { // TODO: Test this
                putString(FirebaseAnalytics.Param.METHOD, "Email")
                putString(FirebaseAnalytics.Param.SUCCESS, "false")
                putString(
                    FirebaseAnalytics.Param.VALUE,
                    dbTask.exception?.message
                )
            })
        auth.signOut()
    }

    /**
     * Sends a verification email to the user
     *
     * Gives feedback on success and errors and logs events with [FirebaseAnalytics]
     * @param email the email of the user
     * @return void
     */
    private fun onSuccessfulDBInsert(email: String) {
        auth.currentUser!!.sendEmailVerification()
            .addOnCompleteListener { verifyTask ->
                if (verifyTask.isSuccessful) {
                    Toast.makeText(
                        this,
                        "Verification email sent to $email",
                        Toast.LENGTH_SHORT
                    ).show()
                    analytics.logEvent(FirebaseAnalytics.Event.SIGN_UP,
                        Bundle().apply { // TODO: Test this
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                            putString(FirebaseAnalytics.Param.SUCCESS, "true")
                        })
                    finish()
                } else {
                    Toast.makeText(
                        this,
                        "Failed to send verification email",
                        Toast.LENGTH_SHORT
                    ).show()
                    analytics.logEvent(FirebaseAnalytics.Event.SIGN_UP,
                        Bundle().apply {
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                            putString(FirebaseAnalytics.Param.SUCCESS, "false")
                            putString(
                                FirebaseAnalytics.Param.VALUE,
                                verifyTask.exception?.message
                            )
                        })
                }
            }
    }

    /**
     * Toggles if the fields are enabled or disabled
     * @param enable Boolean to enable or disable the fields
     * @return void
     */
    private fun toggleFields(enable: Boolean) {
        registerBtn.isEnabled = enable
        nameField.isEnabled = enable
        emailField.isEnabled = enable
        passwordField.isEnabled = enable
        confirmPasswordField.isEnabled = enable
        zipCodeField.isEnabled = enable
        cityField.isEnabled = enable
        countryField.isEnabled = enable
        birthdayField.isEnabled = enable
    }

    /**
     * Checks if the fields are valid.
     *
     * Gives feedback to the user if the fields are invalid.
     * It also change the focus to the invalid field.
     * @param username The username of the user.
     * @param email The email of the user.
     * @param password The password of the user.
     * @param zipCode The zip code of the user.
     * @param city The city of the user.
     * @param country The country of the user.
     * @param birthday The birthday of the user.
     * @return Boolean True if fields are valid, false if not
     */
    private fun areFieldsValid(
        username: String,
        email: String,
        password: String,
        zipCode: String,
        city: String,
        country: String,
        birthday: String
    ): Boolean {
        if (username.isEmpty()) {
            nameField.error = "Username cannot be empty"
            nameField.requestFocus()
            return false
        }
        if (email.isEmpty()) {
            emailField.error = "Email cannot be empty"
            emailField.requestFocus()
            return false
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailField.error = "Invalid email address"
            emailField.requestFocus()
            return false
        }
        if (password.isEmpty() || password.length < 6) {
            passwordField.error = "Password must be at least 6 characters"
            passwordField.requestFocus()
            return false
        }
        // 3 booleans for each criteria (digits, lowercase, uppercase)
        val criteria = BooleanArray(3)
        for (i in password.indices) {
            // Check if the password contains at least one number
            if (password[i].isDigit()) {
                criteria[0] = true
            }
            // Check if the password contains at least one uppercase letter
            if (password[i].isUpperCase()) {
                criteria[1] = true
            }
            // Check if the password contains at least one lowercase letter
            if (password[i].isLowerCase()) {
                criteria[2] = true
            }
        }
        // if valid is should be [true, true, true]
        // eg. [true, false, true] is invalid (no uppercase letter)
        if (criteria.contains(false)) {
            passwordField.error =
                "Password must contain at least one number, one uppercase letter and one lowercase letter"
            passwordField.requestFocus()
            return false
        }
        if (zipCode.isEmpty()) {
            zipCodeField.error = "Zipcode cannot be empty"
            zipCodeField.requestFocus()
            return false
        }
        if (city.isEmpty()) {
            cityField.error = "City cannot be empty"
            cityField.requestFocus()
            return false
        }
        if (country.isEmpty()) {
            countryField.error = "Country cannot be empty"
            countryField.requestFocus()
            return false
        }
        if (birthday.isEmpty()) {
            birthdayField.error = "Birthday cannot be empty"
            return false
        }
        return true
    }
}