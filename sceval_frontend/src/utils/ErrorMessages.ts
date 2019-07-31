export default function handleErrors(reason: string): string {
    let transformedErr =  '';
    switch (reason) {
        case 'UNKNOWN_EMAIL':
            transformedErr = 'We don\'t have a user with that email.';
            break;
        case 'INVALID_EMAIL':
            transformedErr = 'You entered an invalid email.';
            break;
        case 'CONNECTION_ERROR':
            transformedErr = 'We\re having trouble processing your request.';
            break;
        case 'INVALID_TOKEN':
            transformedErr = 'Sorry, the link you used is invalid.';
            break;
        case 'INCORRECT_PASSWORD':
            transformedErr = 'Your password is incorrect.';
            break;
        case 'PASSWORD_TOO_SHORT':
                transformedErr = 'Your password is too short.';
                break;
        case 'PASSWORD_TOO_WEAK':
            transformedErr =  'Please pick a more secure password.';
            break;
        case 'EXCEEDED_MAX_USERS':
            transformedErr =  'You\'ve exceeded the maximum number of users allowed.';
            break;
        case 'USER_EXISTS_UNVERIFIED': 
            transformedErr =  'This email address has already been used.';
            break;
        case 'USER_EXISTS': 
            transformedErr =  'This email address has already been used.';
            break;
        default:
            break;
    }
    return transformedErr;
}