package com.flamtkz_x.inbloc

import android.app.DatePickerDialog
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
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
     * Register the user
     * @param username the username of the user
     * @param email the email of the user
     * @param password the password of the user
     * @param zipCode the zip code of the user
     * @param city the city of the user
     * @param country the country of the user
     * @param birthday the birthday of the user
     * @return void
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
        if (username.isEmpty()) {
            nameField.error = "Username cannot be empty"
            nameField.requestFocus()
            return
        }
        if (email.isEmpty()) {
            emailField.error = "Email cannot be empty"
            emailField.requestFocus()
            return
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailField.error = "Invalid email address"
            emailField.requestFocus()
            return
        }
        if (password.isEmpty() || password.length < 6) {
            passwordField.error = "Password must be at least 6 characters"
            passwordField.requestFocus()
            return
        }
        var valid = 0
        for (i in password.indices) {
            // Check if the password contains at least one number
            if (password[i].isDigit()) {
                valid++
            }
            // Check if the password contains at least one uppercase letter
            if (password[i].isUpperCase()) {
                valid++
            }
            // Check if the password contains at least one lowercase letter
            if (password[i].isLowerCase()) {
                valid++
            }
        }
        if (valid < 3) {
            passwordField.error =
                "Password must contain at least one number, one uppercase letter and one lowercase letter"
            passwordField.requestFocus()
            return
        }
        if (zipCode.isEmpty()) {
            zipCodeField.error = "Zipcode cannot be empty"
            zipCodeField.requestFocus()
            return
        }
        if (city.isEmpty()) {
            cityField.error = "City cannot be empty"
            cityField.requestFocus()
            return
        }
        if (country.isEmpty()) {
            countryField.error = "Country cannot be empty"
            countryField.requestFocus()
            return
        }
        if (birthday.isEmpty()) {
            birthdayField.error = "Birthday cannot be empty"
            return
        }
        registerBtn.isEnabled = false
        nameField.isEnabled = false
        emailField.isEnabled = false
        passwordField.isEnabled = false
        confirmPasswordField.isEnabled = false
        zipCodeField.isEnabled = false
        cityField.isEnabled = false
        countryField.isEnabled = false
        birthdayField.isEnabled = false
        progressBar.visibility = android.view.View.VISIBLE

        auth.createUserWithEmailAndPassword(email, password)
            .addOnCompleteListener(this) { task ->
                registerBtn.isEnabled = true
                nameField.isEnabled = true
                emailField.isEnabled = true
                passwordField.isEnabled = true
                confirmPasswordField.isEnabled = true
                zipCodeField.isEnabled = true
                cityField.isEnabled = true
                countryField.isEnabled = true
                birthdayField.isEnabled = true
                progressBar.visibility = android.view.View.GONE
                if (task.isSuccessful) {
                    // Sign in success, TODO: update UI with the signed-in user's information
                    Toast.makeText(this, "Registration successful", Toast.LENGTH_SHORT).show()
                    analytics.logEvent(FirebaseAnalytics.Event.SIGN_UP,
                        Bundle().apply { // TODO: Test this
                            putString(FirebaseAnalytics.Param.METHOD, "Email")
                            putString(FirebaseAnalytics.Param.SUCCESS, "true")
                        })
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
                            auth.currentUser!!.sendEmailVerification()
                                .addOnCompleteListener { verfiyTask ->
                                    if (verfiyTask.isSuccessful) {
                                        Toast.makeText(
                                            this,
                                            "Verification email sent to $email",
                                            Toast.LENGTH_SHORT
                                        ).show()
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
                                                    verfiyTask.exception?.message
                                                )
                                            })
                                    }
                                }
                            finish()
                        } else {
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
                    }
                    finish()
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
}