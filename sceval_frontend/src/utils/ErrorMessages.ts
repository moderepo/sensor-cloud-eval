import { MODE_CONSTANTS } from '../controllers/ModeAPI';

export default function handleErrors(reason: string): string {
    let transformedErr =  '';
    switch (reason) {
        case MODE_CONSTANTS.ERROR_UNKNOWN_EMAIL:
            transformedErr = 'We don\'t have a user with that email.';
            break;
        case MODE_CONSTANTS.ERROR_INVALID_EMAIL:
            transformedErr = 'You entered an invalid email.';
            break;
        case MODE_CONSTANTS.ERROR_CONNECTION_ERROR:
            transformedErr = 'We\re having trouble processing your request.';
            break;
        case MODE_CONSTANTS.ERROR_INVALID_TOKEN:
            transformedErr = 'Sorry, the link you used is invalid.';
            break;
        case MODE_CONSTANTS.ERROR_INCORRECT_PASSWORD:
            transformedErr = 'Your password is incorrect.';
            break;
        case MODE_CONSTANTS.ERROR_PASSWORD_TOO_SHORT:
            transformedErr = 'Your password is too short.';
            break;
        case MODE_CONSTANTS.ERROR_PASSWORD_TOO_WEAK:
            transformedErr =  'Please pick a more secure password.';
            break;
        case MODE_CONSTANTS.ERROR_EXCEEDED_MAX_USERS:
            transformedErr =  'You\'ve exceeded the maximum number of users allowed.';
            break;
        case MODE_CONSTANTS.ERROR_USER_EXISTS_UNVERIFIED: 
            transformedErr =  'This email address has already been used.';
            break;
        case MODE_CONSTANTS.ERROR_USER_EXISTS: 
            transformedErr =  'This email address has already been used.';
            break;
        case MODE_CONSTANTS.ERROR_USER_UNVERIFIED:
            transformedErr =  'User has not verified.';
            break;
        default:
            break;
    }
    return transformedErr;
}