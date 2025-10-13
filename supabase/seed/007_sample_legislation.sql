-- Sample legislation data for testing
INSERT INTO legislation (
    title,
    description,
    act_name,
    article_number,
    section_number,
    content,
    effective_date,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'General Product Safety Regulation (EU) 2023/988',
    'Regulation on the safety of products placed on the EU market',
    'GPSR',
    NULL,
    NULL,
    'This Regulation lays down rules for ensuring that products placed on the Union market are safe.',
    '2024-12-13',
    true,
    NOW(),
    NOW()
),
(
    'Low Voltage Directive 2014/35/EU',
    'Directive on the harmonisation of the laws of the Member States relating to the making available on the market of electrical equipment designed for use within certain voltage limits',
    'LVD',
    NULL,
    NULL,
    'This Directive lays down health and safety requirements for electrical equipment designed for use within certain voltage limits.',
    '2014-03-29',
    true,
    NOW(),
    NOW()
),
(
    'Electromagnetic Compatibility Directive 2014/30/EU',
    'Directive on the harmonisation of the laws of the Member States relating to electromagnetic compatibility',
    'EMC',
    NULL,
    NULL,
    'This Directive aims to ensure that electrical and electronic apparatus does not generate, or is not affected by, electromagnetic disturbance.',
    '2014-03-29',
    true,
    NOW(),
    NOW()
),
(
    'Toy Safety Directive 2009/48/EC',
    'Directive on the safety of toys',
    'TSD',
    NULL,
    NULL,
    'This Directive lays down rules on the safety of toys and on the free movement of toys in the Community.',
    '2009-06-30',
    true,
    NOW(),
    NOW()
),
(
    'Radio Equipment Directive 2014/53/EU',
    'Directive on the harmonisation of the laws of the Member States relating to the making available on the market of radio equipment',
    'RED',
    NULL,
    NULL,
    'This Directive establishes a regulatory framework for the placing on the market and putting into service in the Union of radio equipment.',
    '2014-04-16',
    true,
    NOW(),
    NOW()
),
(
    'Construction Products Regulation (EU) 305/2011',
    'Regulation laying down harmonised conditions for the marketing of construction products',
    'CPR',
    NULL,
    NULL,
    'This Regulation lays down conditions for the placing or making available on the market of construction products.',
    '2011-03-09',
    true,
    NOW(),
    NOW()
),
(
    'Machinery Directive 2006/42/EC',
    'Directive on machinery, and amending Directive 95/16/EC',
    'MD',
    NULL,
    NULL,
    'This Directive covers the design and construction of machinery and interchangeable equipment.',
    '2006-05-17',
    true,
    NOW(),
    NOW()
),
(
    'Personal Protective Equipment Regulation (EU) 2016/425',
    'Regulation on personal protective equipment',
    'PPE',
    NULL,
    NULL,
    'This Regulation lays down requirements for the design and manufacture of personal protective equipment.',
    '2016-03-09',
    true,
    NOW(),
    NOW()
);

