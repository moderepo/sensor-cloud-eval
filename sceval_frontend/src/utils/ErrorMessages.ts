import { ModeConstants } from '../controllers/ModeAPI';
import { Constants } from './Constants';

export default function handleErrors(reason: string): string {
    let transformedErr =  '';
    switch (reason) {
        case ModeConstants.ERROR_UNKNOWN_EMAIL:
            transformedErr = 'We don\'t have a user with that email.';
            break;
        case ModeConstants.ERROR_INVALID_EMAIL:
            transformedErr = 'You entered an invalid email.';
            break;
        case Constants.ERROR_CONNECTION_ERROR:
            transformedErr = 'We\re having trouble processing your request.';
            break;
        case ModeConstants.ERROR_INVALID_TOKEN:
            transformedErr = 'Sorry, the link you used is invalid.';
            break;
        case ModeConstants.ERROR_INCORRECT_PASSWORD:
            transformedErr = 'Your password is incorrect.';
            break;
        case ModeConstants.ERROR_PASSWORD_TOO_SHORT:
            transformedErr = 'Your password is too short.';
            break;
        case ModeConstants.ERROR_PASSWORD_TOO_WEAK:
            transformedErr =  'Please pick a more secure password.';
            break;
        case ModeConstants.ERROR_EXCEEDED_MAX_USERS:
            transformedErr =  'You\'ve exceeded the maximum number of users allowed.';
            break;
        case ModeConstants.ERROR_USER_EXISTS_UNVERIFIED: 
            transformedErr =  'This email address has already been used.';
            break;
        case ModeConstants.ERROR_USER_EXISTS: 
            transformedErr =  'This email address has already been used.';
            break;
        case ModeConstants.ERROR_USER_UNVERIFIED:
            transformedErr =  'User has not verified.';
            break;
        default:
            break;
    }
    return transformedErr;
}