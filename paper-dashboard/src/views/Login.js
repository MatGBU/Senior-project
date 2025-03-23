import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
} from "reactstrap";

function LoginPage() {
  // Toggle between Login and Register modes
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!email || !password || (isRegister && !confirmPassword)) {
      setErrorMessage('All fields are required!');
      setIsLoading(false);
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('Passwords do not match!');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Call the registration API endpoint
        const res = await fetch('http://167.88.45.119:5001/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Registration successful! Please log in.');
          setIsRegister(false);
        } else {
          setErrorMessage(data.error || 'Registration failed');
        }
      } else {
        // Call the login API endpoint
        const res = await fetch('http://167.88.45.119:5001/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Login successful!');
          localStorage.setItem('isLoggedIn', 'true');
          window.location.href = '/admin/dashboard';
        } else {
          setErrorMessage(data.error || 'Invalid email or password');
        }
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="content">
      <Row className="justify-content-center">
        <Col md="6" lg="4">
          <Card>
            <CardHeader>
              <CardTitle tag="h4">
                {isRegister ? 'Register' : 'Login'}
              </CardTitle>
            </CardHeader>
            <CardBody>
              {errorMessage && (
                <Alert color="danger">
                  <span>{errorMessage}</span>
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="password">Password</Label>
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormGroup>
                {isRegister && (
                  <FormGroup>
                    <Label for="confirmPassword">Confirm Password</Label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </FormGroup>
                )}
                <Button block color="primary" type="submit" disabled={isLoading}>
                  {isLoading
                    ? isRegister ? 'Registering...' : 'Logging in...'
                    : isRegister ? 'Register' : 'Login'}
                </Button>
              </Form>
              <div className="text-center mt-3">
                {isRegister ? (
                  <p>
                    Already have an account?{" "}
                    <a href="#login" onClick={toggleMode}>
                      Login here
                    </a>.
                  </p>
                ) : (
                  <p>
                    Don't have an account?{" "}
                    <a href="#register" onClick={toggleMode}>
                      Register here
                    </a>.
                  </p>
                )}
              </div>
              {!isRegister && (
                <div className="text-center mt-3">
                  <a href="#forgot-password">Forgot Password?</a>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default LoginPage;
