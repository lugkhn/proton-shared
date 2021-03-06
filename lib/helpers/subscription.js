import { PLAN_TYPES, PLAN_SERVICES, PLANS, CYCLE } from '../constants';
import { toMap } from './object';
import { hasBit } from './bitset';

const { PLAN, ADDON } = PLAN_TYPES;
const { MAIL } = PLAN_SERVICES;
const { PLUS, VPNPLUS, VPNBASIC, VISIONARY } = PLANS;

/**
 * Get plan from current subscription
 * @param {Array} subscription.Plans
 * @param {Integer} service
 * @returns {Object} plan
 */
export const getPlan = ({ Plans = [] } = {}, service = MAIL) => {
    return Plans.find(({ Services, Type }) => Type === PLAN && Services & service) || {};
};

export const getPlans = ({ Plans = [] } = {}) => Plans.filter(({ Type }) => Type === PLAN);
export const getAddons = ({ Plans = [] } = {}) => Plans.filter(({ Type }) => Type === ADDON);

/**
 *
 * @param {Object} subscription
 * @param {Integer} service
 * @returns {String} plan name
 */
export const getPlanName = (subscription = {}, service = MAIL) => {
    const { Name = '' } = getPlan(subscription, service);
    return Name;
};

/**
 * Check if a subscription is eligible to BUNDLE coupon
 * @param {Object} subscription
 * @returns {Boolean} is eligible to BUNDLE
 */
export const isBundleEligible = (subscription = {}) => {
    const { Plans = [], CouponCode = '' } = subscription;

    if (CouponCode) {
        return false;
    }

    if (!Plans.length) {
        return true;
    }

    const plans = getPlans(subscription);

    if (plans.length > 1) {
        return false;
    }

    const [{ Name = '' }] = plans;

    return [PLUS, VPNPLUS].includes(Name);
};

export const hasLifetime = (subscription = {}) => {
    const { CouponCode = '' } = subscription;
    return CouponCode === 'LIFETIME';
};

/**
 * Check if the current subscription has visionary plan
 * @param {Object} subscription
 * @returns {Boolean}
 */
export const hasVisionary = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VISIONARY);
};

export const hasMailPlus = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === PLUS);
};

export const hasVpnBasic = (subscription = {}) => {
    const { Plans = [] } = subscription;
    return Plans.some(({ Name }) => Name === VPNBASIC);
};

/**
 *
 * @param {String} name plan or addon name
 * @param {Array} plans coming for Plans API
 * @param {Object} subscription
 * @returns {Number} price
 */
export const getMonthlyBaseAmount = (name = '', plans = [], subscription = {}) => {
    const base = plans.find(({ Name }) => Name === name);
    return subscription.Plans.filter(({ Name }) => Name === name).reduce((acc) => acc + base.Pricing[CYCLE.MONTHLY], 0);
};

/**
 * Calculate total from planIDs configuration
 * @param {Array<Object>} params.plans
 * @param {Object} params.planIDs
 * @param {Number} params.cycle
 * @param {Number} params.service
 * @returns {Number} total
 */
export const getTotal = ({ plans = [], planIDs = {}, cycle = CYCLE.MONTHLY, service }) => {
    const plansMap = toMap(plans);
    return Object.entries(planIDs).reduce((acc, [planID = '', quantity = 0]) => {
        const { Pricing = {}, Services } = plansMap[planID];

        if (Number.isInteger(service) && !hasBit(Services, service)) {
            return acc;
        }

        return acc + Pricing[cycle] * quantity;
    }, 0);
};
